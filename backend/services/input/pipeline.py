"""
UDP Pipeline Manager
Manages GStreamer pipelines for multicasting raw DeckLink video/audio
"""
import os
import signal
import subprocess
from typing import Optional
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))
from shared.logger import setup_logger

logger = setup_logger('udp-pipeline')

class UDPPipelineManager:
    """Manages lifecycle of UDP multicast GStreamer pipelines"""
    
    def __init__(self):
        self.active_pipelines = {}
    
    def build_pipeline(self, device_number: int, multicast_ip: str, 
                       video_port: int, audio_port: int) -> str:
        """
        Build GStreamer pipeline for raw RTP multicast
        
        Returns:
            GStreamer pipeline string
        """
        pipeline = f"""
        decklinkvideosrc device-number={device_number} connection=sdi mode=auto
        ! videoconvert
        ! video/x-raw,format=UYVY
        ! rtpvrawpay mtu=9000
        ! udpsink host={multicast_ip} port={video_port} auto-multicast=true ttl-mc=1 async=false multicast-iface="lo"
        
        decklinkaudiosrc device-number={device_number}
        ! audioconvert ! audioresample
        ! audio/x-raw,format=S16BE,channels=2,rate=48000
        ! rtpL16pay mtu=1400
        ! udpsink host={multicast_ip} port={audio_port} auto-multicast=true ttl-mc=1 async=false multicast-iface="lo"
        """
        return ' '.join(pipeline.split())
    
    def start(self, device_number: int, multicast_ip: str,
              video_port: int, audio_port: int) -> Optional[int]:
        """
        Start UDP multicast pipeline
        
        Returns:
            Process PID if successful, None otherwise
        """
        try:
            pipeline_str = self.build_pipeline(
                device_number, multicast_ip, video_port, audio_port
            )
            
            logger.info(f"Starting UDP multicast: {multicast_ip}:{video_port}/{audio_port}")
            
            process = subprocess.Popen(
                ['gst-launch-1.0'] + pipeline_str.split(),
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
                preexec_fn=os.setsid if os.name != 'nt' else None
            )
            
            # Give it a moment to start
            import time
            time.sleep(0.5)
            
            if process.poll() is None:
                self.active_pipelines[process.pid] = process
                logger.info(f"Pipeline started with PID {process.pid}")
                return process.pid
            else:
                stderr = process.stderr.read() if process.stderr else b''
                logger.error(f"Pipeline failed to start: {stderr.decode()}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to start pipeline: {e}")
            return None
    
    def stop(self, pid: int) -> bool:
        """Stop a running pipeline by PID"""
        try:
            if pid in self.active_pipelines:
                process = self.active_pipelines[pid]
                
                # Send SIGTERM for graceful shutdown
                if os.name != 'nt':
                    os.killpg(os.getpgid(process.pid), signal.SIGTERM)
                else:
                    process.terminate()
                
                process.wait(timeout=3)
                del self.active_pipelines[pid]
                logger.info(f"Stopped pipeline PID {pid}")
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to stop pipeline {pid}: {e}")
            return False
    
    def stop_all(self):
        """Stop all active pipelines"""
        for pid in list(self.active_pipelines.keys()):
            self.stop(pid)
