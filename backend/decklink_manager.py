import gi
gi.require_version('Gst', '1.0')
from gi.repository import Gst
from typing import List, Dict, Optional
import time
import logging

import subprocess
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DeckLinkManager:
    """Manages DeckLink device detection and enumeration using GStreamer and SDK tools"""
    
    def __init__(self):
        logger.info("Initializing DeckLinkManager")
        Gst.init(None)
        # Path to the compiled SDK tool for Ubuntu
        self.sdk_tool_path = os.path.join(os.path.dirname(__file__), "cpp", "StatusMonitor")
        
    def get_devices(self, ignore_indices: List[int] = None) -> List[Dict]:
        """
        Enumerate all available DeckLink devices.
        Attempts to use the C++ SDK tool for high-precision telemetry first.
        """
        if ignore_indices is None:
            ignore_indices = []

        # 1. Attempt deep discovery via C++ SDK tool (Ubuntu)
        if os.path.exists(self.sdk_tool_path):
            try:
                logger.info(f"Running SDK discovery tool at {self.sdk_tool_path}")
                result = subprocess.run([self.sdk_tool_path], capture_output=True, text=True, timeout=2)
                if result.returncode == 0:
                    devices = json.loads(result.stdout)
                    # Filter ignored indices
                    return [d for d in devices if d['device_number'] not in ignore_indices]
            except Exception as e:
                logger.warning(f"SDK tool failed: {e}. Falling back to GStreamer probe.")

        # 2. Fallback to GStreamer Generic Probe
        devices = []
        for device_num in range(16):
            if device_num in ignore_indices:
                continue

            try:
                device_info = self._probe_device(device_num)
                if device_info:
                    devices.append(device_info)
                else:
                    if device_num > 3 and len(devices) == 0: break
                    elif device_num > (len(devices) + 2): break
            except Exception as e:
                logger.debug(f"Error checking index {device_num}: {e}")
                
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
            # This is fast and reliable.
            ret = pipeline.set_state(Gst.State.READY)
            
            # If it reports FAILURE, it might be busy or non-existent.
            # We'll try to get the name property anyway if we can.
            name = None
            try:
                name = source.get_property("device-name")
            except:
                pass

            if ret == Gst.StateChangeReturn.FAILURE and not name:
                logger.debug(f"Device index {device_num} failed READY state and has no name (likely does not exist)")
                pipeline.set_state(Gst.State.NULL)
                return None
            
            # AT THIS POINT, HARDWARE LIKELY EXISTS!
            has_signal = False
            detected_format = "No Signal"
            
            display_name = name if name and "DeckLink" in name else f"DeckLink Port {device_num}"

            # STEP 2: Check signal (PLAYING state)
            bus = pipeline.get_bus()
            ret = pipeline.set_state(Gst.State.PLAYING)
            
            if ret != Gst.StateChangeReturn.FAILURE:
                # Wait for signal.
                start_time = time.time()
                timeout = 0.5 
                
                while time.time() - start_time < timeout:
                    msg = bus.pop_filtered(0.1 * Gst.SECOND, Gst.MessageType.ELEMENT | Gst.MessageType.ERROR)
                    if not msg:
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
                            detected_format = f"{width}p{int(fps_n/fps_d)}"
                    except:
                        detected_format = "Signal Detected"
            else:
                logger.debug(f"Device {device_num} exists but failed to reach PLAYING state (likely busy)")
                detected_format = "Hardware Busy"

            device_info = {
                "id": f"decklink_{device_num}",
                "device_number": device_num,
                "name": display_name,
                "inputs": [{
                    "id": f"input_{device_num}",
                    "port": "SDI",
                    "device_number": device_num,
                    "signal_detected": has_signal,
                    "format": detected_format,
                    "active": False
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
