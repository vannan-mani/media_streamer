"""
Sentinel Uplink Service
Reads intent.json and manages RTMP encoding pipelines from UDP multicast to destinations
"""
import time
import sys
import os
import json

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from shared.logger import setup_logger
from shared.config_manager import ConfigManager
from services.uplink.pipeline import RTMPPipelineManager

logger = setup_logger('sentinel-uplink')

class UplinkService:
    """Intent-based RTMP encoding service"""
    
    def __init__(self):
        self.config = ConfigManager()
        self.pipeline_manager = RTMPPipelineManager()
        self.active_streams = {}
        
    def load_stream_config(self):
        """Load stream destinations from config"""
        config_path = os.path.join(os.path.dirname(__file__), '../../stream_config.json')
        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load stream_config.json: {e}")
            return {'destinations': {}}
    
    def load_presets(self):
        """Load encoding presets"""
        presets_path = os.path.join(os.path.dirname(__file__), '../../encoding_presets.json')
        try:
            with open(presets_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load encoding_presets.json: {e}")
            return {'presets': {}}
    
    def reconcile_streams(self):
        """Start/stop RTMP streams based on intent"""
        intent_data = self.config.read('intent.json', {})
        registry = self.config.read('device_registry.json', {'devices': {}})
        stream_config = self.load_stream_config()
        presets = self.load_presets()
        
        intent = intent_data.get('intent', 'DISABLED')
        configuration = intent_data.get('configuration', {})
        
        if intent == 'AUTO_STREAM':
            # User wants to stream
            device_id = configuration.get('selected_device_id', 0)
            input_id = configuration.get('selected_input_id')
            dest_id = configuration.get('selected_destination_id')
            preset_id = configuration.get('selected_preset_id')
            
            if not all([input_id, dest_id, preset_id]):
                logger.warning("Incomplete configuration, cannot start stream")
                return
            
            # Find the input in registry
            device_key = f"decklink_{device_id}"
            device = registry['devices'].get(device_key)
            if not device:
                logger.error(f"Device {device_key} not found in registry")
                return
            
            input_entry = next((i for i in device.get('inputs', []) if i['id'] == input_id), None)
            if not input_entry or not input_entry.get('signal_detected'):
                logger.warning(f"Input {input_id} not available or no signal")
                return
            
            udp_config = input_entry.get('udp', {})
            if udp_config.get('status') != 'streaming':
                logger.warning(f"UDP multicast not active for {input_id}")
                return
            
            # Parse destination ID (format: "platform_id:stream_id")
            try:
                platform_id, stream_id = dest_id.split(':', 1)
            except ValueError:
                logger.error(f"Invalid destination ID format: {dest_id}")
                return
            
            # Get destination details
            platform = stream_config['destinations'].get(platform_id)
            if not platform:
                logger.error(f"Platform {platform_id} not found")
                return
            
            stream = next((s for s in platform.get('streams', []) if s['id'] == stream_id), None)
            if not stream:
                logger.error(f"Stream {stream_id} not found in platform {platform_id}")
                return
            
            # Get preset
            preset = None
            for quality_group in presets.get('presets', {}).values():
                for variant in quality_group.get('variants', []):
                    if variant['id'] == preset_id:
                        preset = variant
                        break
                if preset:
                    break
            
            if not preset:
                logger.error(f"Preset {preset_id} not found")
                return
            
            # Build RTMP URL
            rtmp_base = platform.get('rtmp_url', '')
            rtmp_url = f"{rtmp_base}/{stream['key']}"
            
            # Check if already streaming (and ensure it's alive)
            stream_key = f"{input_id}:{dest_id}"
            if stream_key in self.active_streams:
                stream_info = self.active_streams[stream_key]
                pid = stream_info['pid']
                
                if self.pipeline_manager.is_alive(pid):
                    logger.debug(f"Stream {stream_key} is healthy (PID {pid})")
                    return
                else:
                    logger.warning(f"Stream {stream_key} (PID {pid}) died unexpectedly. Cleanup and restart.")
                    del self.active_streams[stream_key]
            
            # Start RTMP pipeline
            logger.info(f"Starting stream: {input_id} → {dest_id} ({preset['name']})")
            pid = self.pipeline_manager.start(
                multicast_ip=udp_config['multicast_ip'],
                video_port=udp_config['video_port'],
                audio_port=udp_config['audio_port'],
                rtmp_url=rtmp_url,
                preset=preset
            )
            
            if pid:
                self.active_streams[stream_key] = {
                    'pid': pid,
                    'input_id': input_id,
                    'destination_id': dest_id,
                    'preset_id': preset_id
                }
                logger.info(f"Stream started with PID {pid}")
        
        else:  # intent == 'DISABLED'
            # Stop all streams
            for stream_key, stream_info in list(self.active_streams.items()):
                logger.info(f"Stopping stream: {stream_key}")
                self.pipeline_manager.stop(stream_info['pid'])
                del self.active_streams[stream_key]
    
    def run(self):
        """Main service loop"""
        logger.info("Sentinel Uplink Service starting...")
        
        while True:
            try:
                self.reconcile_streams()
                time.sleep(1.0)  # 1-second reconciliation interval
                
            except KeyboardInterrupt:
                logger.info("Shutting down...")
                self.pipeline_manager.stop_all()
                break
            except Exception as e:
                logger.error(f"Service loop error: {e}")
                time.sleep(1.0)

if __name__ == '__main__':
    service = UplinkService()
    service.run()
