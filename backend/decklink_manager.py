import gi
gi.require_version('Gst', '1.0')
from gi.repository import Gst
from typing import List, Dict, Optional
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DeckLinkManager:
    """Manages DeckLink device detection and enumeration using GStreamer"""
    
    def __init__(self):
        logger.info("Initializing DeckLinkManager")
        Gst.init(None)
        
    def get_devices(self, ignore_indices: List[int] = None) -> List[Dict]:
        """
        Enumerate all available DeckLink devices and their inputs
        Returns list of devices with their input status
        """
        devices = []
        if ignore_indices is None:
            ignore_indices = []
        
        # We start searching for devices. 
        # For Blackmagic Duo or Quad cards, GStreamer sees each port as a separate device-number.
        for device_num in range(16):
            if device_num in ignore_indices:
                continue

            try:
                device_info = self._probe_device(device_num)
                if device_info:
                    devices.append(device_info)
                    logger.info(f"Found DeckLink hardware at index {device_num}")
                else:
                    # If we don't find a device at this index, we stop searching
                    # Devices are typically zero-indexed and continuous
                    if device_num > 0 and len(devices) == 0:
                        # Safety break if we've checked a few and found nothing
                        if device_num > 3: break
                    elif device_num > 0 and device_num > (len(devices) + 2):
                        # Break if we have a gap of more than 2
                        break
            except Exception as e:
                logger.debug(f"Error checking index {device_num}: {e}")
                
        if not devices:
            logger.warning("No physical DeckLink hardware detected.")
            
        return devices
    
    def _probe_device(self, device_num: int) -> Optional[Dict]:
        """
        Probe a specific DeckLink device using a state change check.
        This is the most reliable way to confirm hardware existence and signal.
        """
        source = None
        pipeline = None
        try:
            source = Gst.ElementFactory.make("decklinkvideosrc", f"probe_src_{device_num}")
            if not source:
                logger.debug(f"decklinkvideosrc element not available for index {device_num}")
                return None
            
            source.set_property("device-number", device_num)
            
            # Create a dummy pipeline to trigger hardware check
            pipeline = Gst.Pipeline.new(f"probe_pipe_{device_num}")
            sink = Gst.ElementFactory.make("fakesink", f"probe_sink_{device_num}")
            pipeline.add(source)
            pipeline.add(sink)
            source.link(sink)
            
            # STEP 1: Check hardware existence (READY state)
            # This is fast and reliable. If this fails, the device number is invalid.
            ret = pipeline.set_state(Gst.State.READY)
            if ret == Gst.StateChangeReturn.FAILURE:
                logger.debug(f"Device index {device_num} failed to reach READY state (likely does not exist)")
                pipeline.set_state(Gst.State.NULL)
                return None
            
            # AT THIS POINT, HARDWARE EXISTS! We must return it even if signal detection fails.
            has_signal = False
            detected_format = "No Signal"
            
            # Get device name while in READY state
            try:
                name = source.get_property("device-name")
            except:
                name = None
            display_name = name if name and "DeckLink" in name else f"DeckLink SDI Port {device_num}"

            # STEP 2: Check signal (PLAYING state)
            # This is more intensive. We don't fail the probe if this fails.
            bus = pipeline.get_bus()
            ret = pipeline.set_state(Gst.State.PLAYING)
            
            if ret != Gst.StateChangeReturn.FAILURE:
                # Wait for signal. We'll poll the bus for a moment.
                start_time = time.time()
                timeout = 0.8 # Reduced timeout slightly for responsiveness
                
                while time.time() - start_time < timeout:
                    msg = bus.pop_filtered(0.1 * Gst.SECOND, Gst.MessageType.ELEMENT | Gst.MessageType.ERROR)
                    if not msg:
                        # Polling fallback
                        try:
                            if source.get_property("signal"):
                                has_signal = True
                                break
                        except: pass
                        continue
                    
                    if msg.type == Gst.MessageType.ELEMENT:
                        struct = msg.get_structure()
                        if struct.get_name() == "decklink-video-input-signal-changed":
                            has_signal = struct.get_value("present")
                            if has_signal: break
                    elif msg.type == Gst.MessageType.ERROR:
                        break
                
                # Double check signal property
                if not has_signal:
                    try:
                        has_signal = source.get_property("signal")
                    except: pass

                if has_signal:
                    try:
                        pad = source.get_static_pad("src")
                        caps = pad.get_current_caps()
                        if caps:
                            s = caps.get_structure(0)
                            width = s.get_value("width")
                            height = s.get_value("height")
                            fps_n = s.get_value("framerate").numerator
                            fps_d = s.get_value("framerate").denominator
                            detected_format = f"{width}x{height} @ {fps_n/fps_d:.2f}fps"
                    except:
                        detected_format = "Signal Detected"
            else:
                logger.debug(f"Device {device_num} exists but failed to reach PLAYING state (might be busy)")
                detected_format = "Hardware Busy"

            device_info = {
                "id": f"decklink_{device_num}",
                "device_number": device_num,
                "name": display_name,
                "inputs": [{
                    "id": f"input_{device_num}",
                    "port": "SDI Input",
                    "device_number": device_num,
                    "signal_detected": has_signal,
                    "format": detected_format,
                    "active": True if device_num == 0 else False
                }]
            }
            
            pipeline.set_state(Gst.State.NULL)
            return device_info
            
        except Exception as e:
            logger.error(f"Critical exception probing device {device_num}: {e}")
            if pipeline: pipeline.set_state(Gst.State.NULL)
            return None
    
    def detect_signal(self, device_num: int) -> Dict:
        """
        Detect signal presence and format on a specific device
        """
        # Actual detection is handled via probe or long-running pipeline telemetry
        return {
            "signal_detected": False,
            "format": "No Signal",
            "connection_type": "SDI"
        }
