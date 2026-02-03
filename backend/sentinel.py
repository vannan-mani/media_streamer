import threading
import time
import json
import logging
import os
from typing import Dict, List, Optional
from decklink_manager import DeckLinkManager
from gstreamer_manager import GStreamerManager
import config

logger = logging.getLogger(__name__)

class StreamSentinel:
    """
    The Autonomous Brain of the streaming system.
    Manages State Reconciliation between User Intent, Hardware Availability, and Pipeline Status.
    """
    def __init__(self, decklink_manager: DeckLinkManager, gstreamer_manager: GStreamerManager):
        self.decklink = decklink_manager
        self.gstreamer = gstreamer_manager
        self.running = False
        self.thread: Optional[threading.Thread] = None
        self.lock = threading.Lock()
        
        # State Persistence
        self.intent_file = "intent.json"
        
        # Centralized Device Registry (The Source of Truth)
        # { "0": { "info": {...}, "status": "IDLE" | "STREAMING" } }
        self.hardware_registry = {}
        
        # Default Configuration (3-tier: input + destination + preset)
        self.configuration = {
            "selected_device_id": 0,
            "selected_input_id": None,  # Hardware input ID (e.g., "input_0")
            "selected_destination_id": None,  # YouTube stream ID (e.g., "youtube:main")
            "selected_preset_id": config.PRESETS_FLAT[0]['id']
        }
        
        self.intent = self._load_intent_and_config()
        
        self.state = {
            "intent": self.intent, # DISABLED, AUTO_STREAM
            "configuration": self.configuration,
            "hardware": self.hardware_registry,
            "system_status": "Starting"
        }

    def start(self):
        """Start the background reconciliation loop"""
        if self.running:
            return
            
        self.running = True
        self.thread = threading.Thread(target=self._service_loop, daemon=True)
        self.thread.start()
        logger.info("Stream Sentinel Service Started")

    def stop(self):
        """Stop the sentinel service"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=2)
        logger.info("Stream Sentinel Service Stopped")
            
    def _service_loop(self):
        """Main autonomous loop running at 1Hz"""
        while self.running:
            try:
                self._reconcile()
            except Exception as e:
                logger.error(f"Sentinel Loop Critical Error: {e}")
            time.sleep(1.0) 

    def _reconcile(self):
        """
        The Core Logic: State Reconciliation
        Compares Desired State (Intent) with Actual State (Hardware/Pipeline)
        """
        # 1. Identify Active Stream Device
        active_device = self.gstreamer.active_device
        
        # 2. Probe Hardware (Scanner Mode)
        # Skip the active device to prevent "Resource Busy" errors
        try:
            ignored = [active_device] if active_device is not None else []
            devices = self.decklink.get_devices(ignore_indices=ignored)
            
            # Update Hardware State Registry safely
            with self.lock:
                current_ids = set()
                
                for dev in devices:
                    dev_id = str(dev['device_number'])
                    current_ids.add(dev_id)
                    
                    if dev_id not in self.hardware_registry:
                        self.hardware_registry[dev_id] = {}
                    
                    self.hardware_registry[dev_id]['info'] = dev
                    self.hardware_registry[dev_id]['status'] = "IDLE"
                    
                # If we have an active device, ensure it's marked correctly in registry
                if active_device is not None:
                    act_id = str(active_device)
                    current_ids.add(act_id)
                    if act_id not in self.hardware_registry:
                         self.hardware_registry[act_id] = {}
                    self.hardware_registry[act_id]['status'] = "STREAMING"
                    
        except Exception as e:
            logger.error(f"Hardware Probe Failed: {e}")

        # 3. Decision Engine
        with self.lock:
            intent = self.state['intent']
            selected_dev_id = self.state['configuration']['selected_device_id']
            selected_preset_id = self.state['configuration']['selected_preset_id']
            selected_input_id = self.state['configuration'].get('selected_input_id')
            selected_dest_id = self.state['configuration'].get('selected_destination_id')
            
        is_streaming = self.gstreamer.is_running()
        
        if intent == "AUTO_STREAM":
            if not is_streaming:
                # Scenario: Auto-Start Check
                if self._is_selected_device_ready(selected_dev_id):
                     self._launch_stream(selected_dev_id, selected_input_id, selected_dest_id, selected_preset_id)
                else:
                    self._update_system_status(f"Waiting for Signal on Device {selected_dev_id}...")
            else:
                # Scenario: Monitor Health
                # TODO: Check if streaming device matches selected device? If not, stop?
                # For now assume stickiness until manual stop.
                if self._is_signal_lost(selected_dev_id):
                     logger.warning("Signal Lost during Auto-Stream. Stopping.")
                     self.gstreamer.stop()
                     self._update_system_status("Signal Lost - Waiting...")
                else:
                     self._update_system_status("Streaming Active")
        
        elif intent == "DISABLED":
            if is_streaming:
                logger.info("Sentinel: Intent changed to DISABLED. Stopping stream.")
                self.gstreamer.stop()
                self._update_system_status("Stream Stopped by User")
            else:
                current_signal = self._is_selected_device_ready(selected_dev_id)
                status = "Ready to Transmit" if current_signal else "No Input Signal"
                self._update_system_status(status)

    def _is_selected_device_ready(self, dev_id: int) -> bool:
        """Check if the selected device has a locked signal"""
        s_id = str(dev_id)
        with self.lock:
            if s_id in self.hardware_registry:
                data = self.hardware_registry[s_id]
                inputs = data.get('info', {}).get('inputs', [])
                for inp in inputs:
                     # Check if specific input port logic needed? 
                     # For now, if ANY input on the card has signal, we proceed.
                     if inp.get('signal_detected'):
                         return True
        return False

    def _is_signal_lost(self, dev_id: int) -> bool:
        """Check if signal is lost on the specific device we are watching"""
        # If streaming, we can't probe! We must rely on GStreamer Errors (implemented in Manager).
        # OR if we are using the 'monitor mode' trick where we skip probing but assume signal unless error.
        # But wait, the Manager handles EOS/Error.
        # Here we mainly check if the Registry update marked it as 'Missing' or similar?
        # Actually, if we are streaming, we skip probing it. So Registry info is stale.
        # So 'Signal Lost' must come from Pipeline callbacks (monitor mode).
        # For simplicity V1: If GStreamer stops running due to error, we detect is_streaming=False next loop.
        return False # Handled by Manager Stopping itself on error

    def _launch_stream(self, device_num, input_id, destination_id, preset_id):
        """Launch the GStreamer pipeline with Configured Options"""
        
        # 1. Load stream config
        config_path = os.path.join(os.path.dirname(__file__), 'stream_config.json')
        try:
            with open(config_path, 'r') as f:
                stream_config = json.load(f)
        except FileNotFoundError:
            self._update_system_status("Error: stream_config.json not found")
            logger.error("stream_config.json not found")
            return
        
        # 2. Parse destination_id (format: "youtube:main")
        if not destination_id or ':' not in destination_id:
            self._update_system_status("Error: Invalid Destination")
            logger.error(f"Invalid destination_id: {destination_id}")
            return
            
        platform_id, stream_id = destination_id.split(':', 1)
        
        # 3. Lookup destination and preset
        platform_config = stream_config.get('destinations', {}).get(platform_id)
        if not platform_config:
            self._update_system_status(f"Error: Platform {platform_id} not found")
            logger.error(f"Platform not found: {platform_id}")
            return
        
        stream = next((s for s in platform_config.get('streams', []) if s['id'] == stream_id), None)
        preset = next((p for p in config.PRESETS_FLAT if p['id'] == preset_id), None)
        
        if not stream or not preset:
            self._update_system_status("Error: Invalid Config")
            logger.error(f"Invalid Config: Stream={stream_id}, Preset={preset_id}")
            return
        
        # 4. Build RTMP URL
        rtmp_base = platform_config.get('rtmp_url', '')
        rtmp_url = f"{rtmp_base}/{stream['key']}"

        try:
            self._update_system_status(f"Starting {preset['name']} Stream...")
            logger.info(f"Sentinel: Launching {preset['name']} to {platform_config['name']} ({stream['name']})")
            
            self.gstreamer.build_pipeline(
                 decklink_device=device_num,
                 youtube_rtmps_url=rtmp_url,
                 resolution=f"{preset['width']}x{preset['height']}",
                 fps=preset['fps'],
                 bitrate=preset['bitrate']
            )
            self.gstreamer.start()
            self._update_system_status("Streaming Active")
        except Exception as e:
             logger.error(f"Failed to auto-launch stream: {e}")
             self._update_system_status("Stream Launch Failed")


    def _update_system_status(self, status: str):
        with self.lock:
            self.state['system_status'] = status

    # --- Persistence ---
    def _load_intent_and_config(self) -> str:
        try:
            if os.path.exists(self.intent_file):
                with open(self.intent_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    val = data.get('intent', 'DISABLED')
                    
                    # Also load configuration override if exists
                    if 'configuration' in data:
                        self.configuration.update(data['configuration'])
                        
                    logger.info(f"Sentinel: Loaded intent '{val}' from disk")
                    return val
        except Exception as e:
            logger.error(f"Failed to load intent: {e}")
        logger.info("Sentinel: Defaulting intent to DISABLED")
        return "DISABLED"

    def _save_state(self):
        try:
            payload = {
                "intent": self.state['intent'],
                "configuration": self.state['configuration']
            }
            with open(self.intent_file, 'w', encoding='utf-8') as f:
                json.dump(payload, f)
            logger.info("Sentinel: Saved state to disk")
        except Exception as e:
            logger.error(f"Failed to save state: {e}")

    # --- Public API ---
    def get_public_state(self) -> Dict:
        """Thread-safe state reader for API"""
        with self.lock:
            return json.loads(json.dumps(self.state)) # Deep copy
            
    def set_intent(self, action: str):
        """Set user intent (AUTO_STREAM or DISABLED)"""
        with self.lock:
            self.state['intent'] = action
            self._save_state()
            logger.info(f"Intent set to: {action}")

    def update_configuration(self, config_update: Dict):
        """Update selected input/channel/preset"""
        with self.lock:
            self.state['configuration'].update(config_update)
            self._save_state()
            logger.info(f"Configuration updated: {config_update}")
