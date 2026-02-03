"""
RTMP Pipeline Manager
Manages GStreamer pipelines for encoding UDP multicast to RTMP destinations
"""
import os
import signal
import subprocess
from typing import Optional, Dict
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))
from shared.logger import setup_logger

logger = setup_logger('rtmp-pipeline')

class RTMPPipelineManager:
    """Manages lifecycle of RTMP encoding GStreamer pipelines"""
    
    def __init__(self):
        self.active_pipelines = {}
    
    def build_pipeline(self, multicast_ip: str, video_port: int, audio_port: int,
                       rtmp_url: str, preset: Dict) -> str:
        """
        Build GStreamer pipeline for UDP → RTMP encoding
        
        Args:
            multicast_ip: Multicast group IP
            video_port: RTP video port
            audio_port: RTP audio port
            rtmp_url: Full RTMP destination URL
            preset: Encoding preset dict with bitrate, fps, etc.
        
        Returns:
            GStreamer pipeline string
        """
        bitrate = preset.get('bitrate', 4500)  # kbps
        fps = preset.get('fps', 60)
        
        # Use rtpbin for proper RTP session management
        pipeline = f"""
        rtpbin name=rtp latency=0
        
        udpsrc multicast-group={multicast_ip} port={video_port} multicast-iface="lo" caps="application/x-rtp"
        ! rtp.recv_rtp_sink_0
        rtp. ! rtpvrawdepay ! videoconvert ! queue max-size-buffers=3 leaky=downstream
        ! x264enc bitrate={bitrate} speed-preset=veryfast tune=zerolatency key-int-max={fps*2}
        ! video/x-h264,profile=high
        ! h264parse ! queue name=v_enc
        
        udpsrc multicast-group={multicast_ip} port={audio_port} multicast-iface="lo" caps="application/x-rtp"
        ! rtp.recv_rtp_sink_1
        rtp. ! rtpL16depay ! audioconvert ! audioresample ! queue max-size-buffers=3 leaky=downstream
        ! avenc_aac bitrate=128000
        ! aacparse ! queue name=a_enc
        
        flvmux name=mux streamable=true
        v_enc. ! mux.
        a_enc. ! mux.
        mux. ! rtmpsink location="{rtmp_url} live=1"
        """
        
        return ' '.join(pipeline.split())
    
    def start(self, multicast_ip: str, video_port: int, audio_port: int,
              rtmp_url: str, preset: Dict) -> Optional[int]:
        """
        Start RTMP encoding pipeline
        
        Returns:
            Process PID if successful, None otherwise
        """
        try:
            pipeline_str = self.build_pipeline(
                multicast_ip, video_port, audio_port, rtmp_url, preset
            )
            
            logger.info(f"Starting RTMP stream to {rtmp_url.split('/')[2]}")  # Hide key
            
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
                logger.info(f"RTMP pipeline started with PID {process.pid}")
                return process.pid
            else:
                stderr = process.stderr.read() if process.stderr else b''
                logger.error(f"Pipeline failed to start: {stderr.decode()}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to start pipeline: {e}")
            return None
    
    def is_alive(self, pid: int) -> bool:
        """Check if pipeline process is still running"""
        if pid in self.active_pipelines:
            process = self.active_pipelines[pid]
            if process.poll() is None:
                return True
            # Clean up dead process
            del self.active_pipelines[pid]
        return False

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
                
                process.wait(timeout=5)
                del self.active_pipelines[pid]
                logger.info(f"Stopped RTMP pipeline PID {pid}")
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to stop pipeline {pid}: {e}")
            return False
    
    def stop_all(self):
        """Stop all active pipelines"""
        for pid in list(self.active_pipelines.keys()):
            self.stop(pid)
