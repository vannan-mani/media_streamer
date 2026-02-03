"""
Sentinel Input Service
Monitors DeckLink hardware and maintains UDP multicast streams for detected signals
"""
import time
import subprocess
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from shared.logger import setup_logger
from shared.config_manager import ConfigManager
from services.input.pipeline import UDPPipelineManager

logger = setup_logger('sentinel-input')

class InputService:
    """Hardware monitoring and UDP multicast service"""
    
    def __init__(self):
        self.config = ConfigManager()
        self.pipeline_manager = UDPPipelineManager()
        self.probe_path = os.path.join(os.path.dirname(__file__), '../../cpp/sentinel-probe')
        
    def discover_hardware(self):
        """Run sentinel-probe to discover DeckLink devices"""
        try:
            result = subprocess.run(
                [self.probe_path],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0 and result.stdout.strip():
                import json
                devices = json.loads(result.stdout)
                return devices
            return []
        except Exception as e:
            logger.error(f"Hardware discovery failed: {e}")
            return []
    
    def assign_udp_ports(self, device_number: int, input_index: int):
        """Assign deterministic UDP ports for video and audio"""
        base_ip = "239.0.0"
        base_port = 5000
        
        multicast_ip = f"{base_ip}.{device_number + 1}"
        video_port = base_port + (device_number * 10) + (input_index * 2)
        audio_port = video_port + 1
        
        return multicast_ip, video_port, audio_port
    
    def reconcile_pipelines(self, devices):
        """Start/stop UDP pipelines based on signal detection"""
        registry = self.config.read('device_registry.json', {'devices': {}})
        
        for device in devices:
            device_id = f"decklink_{device.get('device_number', 0)}"
            device_number = device.get('device_number', 0)
            
            # Initialize device entry
            if device_id not in registry['devices']:
                registry['devices'][device_id] = {
                    'name': device.get('name', f'DeckLink Device {device_number}'),
                    'device_number': device_number,
                    'inputs': []
                }
            
            device_entry = registry['devices'][device_id]
            inputs = device.get('inputs', [])
            
            for idx, inp in enumerate(inputs):
                signal_detected = inp.get('signal_detected', False)
                input_id = inp.get('id', f"{device_id}_input_{idx}")
                
                # Find or create input entry
                input_entry = next((i for i in device_entry['inputs'] if i['id'] == input_id), None)
                if not input_entry:
                    mcast_ip, v_port, a_port = self.assign_udp_ports(device_number, idx)
                    input_entry = {
                        'id': input_id,
                        'port': inp.get('port', 'SDI'),
                        'signal_detected': False,
                        'format': None,
                        'udp': {
                            'multicast_ip': mcast_ip,
                            'video_port': v_port,
                            'audio_port': a_port,
                            'status': 'stopped',
                            'pipeline_pid': None
                        }
                    }
                    device_entry['inputs'].append(input_entry)
                
                # Update signal status
                input_entry['signal_detected'] = signal_detected
                input_entry['format'] = inp.get('format')
                
                # Manage pipelines
                udp_config = input_entry['udp']
                
                if signal_detected and udp_config['status'] != 'streaming':
                    # Start UDP pipeline
                    logger.info(f"Starting UDP pipeline for {input_id} ({inp.get('format')})")
                    pid = self.pipeline_manager.start(
                        device_number=device_number,
                        multicast_ip=udp_config['multicast_ip'],
                        video_port=udp_config['video_port'],
                        audio_port=udp_config['audio_port']
                    )
                    if pid:
                        udp_config['status'] = 'streaming'
                        udp_config['pipeline_pid'] = pid
                
                elif not signal_detected and udp_config['status'] == 'streaming':
                    # Stop UDP pipeline
                    logger.info(f"Stopping UDP pipeline for {input_id}  (signal lost)")
                    if udp_config['pipeline_pid']:
                        self.pipeline_manager.stop(udp_config['pipeline_pid'])
                    udp_config['status'] = 'stopped'
                    udp_config['pipeline_pid'] = None
        
        # Save updated registry
        self.config.write('device_registry.json', registry)
    
    def reset_registry_state(self):
        """Reset all inputs to stopped state on startup to prevent stale state issues"""
        try:
            registry = self.config.read('device_registry.json', {'devices': {}})
            changes_made = False
            
            for device in registry.get('devices', {}).values():
                for inp in device.get('inputs', []):
                    if inp.get('udp', {}).get('status') == 'streaming':
                        inp['udp']['status'] = 'stopped'
                        inp['udp']['pipeline_pid'] = None
                        changes_made = True
            
            if changes_made:
                self.config.write('device_registry.json', registry)
                logger.info("Reset stale registry state to 'stopped'")
        except Exception as e:
            logger.error(f"Failed to reset registry state: {e}")

    def run(self):
        """Main service loop"""
        logger.info("Sentinel Input Service starting...")
        
        # Reset state on startup
        self.reset_registry_state()
        
        while True:
            try:
                devices = self.discover_hardware()
                logger.debug(f"Discovered {len(devices)} devices")
                
                self.reconcile_pipelines(devices)
                
                time.sleep(2.0)  # 2-second discovery interval
                
            except KeyboardInterrupt:
                logger.info("Shutting down...")
                break
            except Exception as e:
                logger.error(f"Service loop error: {e}")
                time.sleep(2.0)

if __name__ == '__main__':
    service = InputService()
    service.run()
