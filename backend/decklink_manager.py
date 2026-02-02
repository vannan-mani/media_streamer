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
            logger.warning("No physical DeckLink hardware detected. Using mock data.")
            devices = self._get_mock_devices()
            
        return devices
    
    def _probe_device(self, device_num: int) -> Optional[Dict]:
        """
        Probe a specific DeckLink device using a state change check.
        This is the most reliable way to confirm hardware existence and signal.
        """
        try:
            source = Gst.ElementFactory.make("decklinkvideosrc", f"probe_src_{device_num}")
            if not source:
                return None
            
            source.set_property("device-number", device_num)
            
            # Create a dummy pipeline to trigger hardware check
            pipeline = Gst.Pipeline.new(f"probe_pipe_{device_num}")
            sink = Gst.ElementFactory.make("fakesink", f"probe_sink_{device_num}")
            pipeline.add(source)
            pipeline.add(sink)
            source.link(sink)
            
            # Use the bus to listen for signal change messages
            bus = pipeline.get_bus()
            
            # Start the pipeline
            ret = pipeline.set_state(Gst.State.PLAYING)
            
            if ret == Gst.StateChangeReturn.FAILURE:
                pipeline.set_state(Gst.State.NULL)
                return None

            # Wait for signal. We'll poll the bus for a moment.
            # DeckLink posts elemental messages when signal is caught.
            has_signal = False
            detected_format = "No Signal"
            
            start_time = time.time()
            timeout = 1.0 # 1 second should be enough for hardware to lock
            
            while time.time() - start_time < timeout:
                msg = bus.pop_filtered(0.1 * Gst.SECOND, Gst.MessageType.ELEMENT | Gst.MessageType.ERROR | Gst.MessageType.STATE_CHANGED)
                if not msg:
                    # Check property as fallback during polling
                    try:
                        if source.get_property("signal"):
                            has_signal = True
                            break
                    except:
                        pass
                    continue
                
                if msg.type == Gst.MessageType.ELEMENT:
                    struct = msg.get_structure()
                    if struct.get_name() == "decklink-video-input-signal-changed":
                        has_signal = struct.get_value("present")
                        if has_signal:
                            logger.info(f"Bus Message: Signal detected on device {device_num}")
                            break
                elif msg.type == Gst.MessageType.ERROR:
                    err, debug = msg.parse_error()
                    logger.debug(f"Bus Error during probe: {err.message}")
                    break
            
            # One last check on properties if bus didn't give us a definitive 'present'
            if not has_signal:
                try:
                    has_signal = source.get_property("signal")
                except:
                    pass

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
                    else:
                        detected_format = "Active Signal"
                except:
                    detected_format = "Active Signal"

            try:
                name = source.get_property("device-name")
            except:
                name = None
            
            # Use identified hardware model as default
            display_name = name if name and "DeckLink" in name else "DeckLink SDI 4K"
            
            device_info = {
                "id": f"decklink_{device_num}",
                "device_number": device_num,
                "name": display_name,
                "inputs": [{
                    "id": f"input_{device_num}",
                    "port": "SDI Input",
                    "device_number": device_num,
                    "signal_detected": has_signal,
                    "format": detected_format if has_signal else "No Signal",
                    "active": True if device_num == 0 else False
                }]
            }
            
            # Clean up
            pipeline.set_state(Gst.State.NULL)
            return device_info
            
        except Exception as e:
            logger.error(f"Exception probing device {device_num}: {e}")
            return None
    
    def _get_mock_devices(self) -> List[Dict]:
        """
        Return mock device data for development/testing
        """
        logger.info("Using mock DeckLink devices for development")
        return [
            {
                "id": "decklink_0",
                "device_number": 0,
                "name": "DeckLink Quad HDMI Recorder (Mock)",
                "inputs": [
                    {
                        "id": "input_0",
                        "port": "HDMI 1",
                        "device_number": 0,
                        "signal_detected": True,
                        "format": "1080p60",
                        "active": False
                    },
                    {
                        "id": "input_1",
                        "port": "HDMI 2",
                        "device_number": 0,
                        "signal_detected": True,
                        "format": "1080p30",
                        "active": True
                    },
                    {
                        "id": "input_2",
                        "port": "HDMI 3",
                        "device_number": 0,
                        "signal_detected": False,
                        "format": None,
                        "active": False
                    },
                    {
                        "id": "input_3",
                        "port": "HDMI 4",
                        "device_number": 0,
                        "signal_detected": False,
                        "format": None,
                        "active": False
                    }
                ]
            }
        ]
    
    def detect_signal(self, device_num: int) -> Dict:
        """
        Detect signal presence and format on a specific device
        This would require creating a test pipeline and checking for signal
        """
        # TODO: Implement actual signal detection
        # For now, return mock data
        return {
            "signal_detected": True,
            "format": "1080p60",
            "connection_type": "HDMI"
        }
