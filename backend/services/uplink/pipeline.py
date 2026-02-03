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
        width = preset.get('width', 1920)
        height = preset.get('height', 1080)
        
        pipeline = f"""
        rtpbin name=rtp latency=0
        
        udpsrc multicast-group={multicast_ip} port={video_port} multicast-iface="lo" caps="application/x-rtp"
        ! rtp.recv_rtp_sink_0
        rtp. ! rtpvrawdepay ! videoconvert 
        ! videoscale ! video/x-raw,width={width},height={height}
        ! identity name=video_stats silent=false
        ! queue max-size-buffers=3 leaky=downstream
        ! x264enc bitrate={bitrate} speed-preset=veryfast tune=zerolatency key-int-max={fps*2}
        ! video/x-h264,profile=high
        ! h264parse 
        ! fpsdisplaysink name=fps_monitor text-overlay=false signal-fps-measurements=true sync=false
        fps_monitor. ! queue name=v_enc
        
        udpsrc multicast-group={multicast_ip} port={audio_port} multicast-iface="lo" caps="application/x-rtp"
        ! rtp.recv_rtp_sink_1
        rtp. ! rtpL16depay ! audioconvert ! audioresample 
        ! identity name=audio_stats silent=false
        ! queue max-size-buffers=3 leaky=downstream
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
            
            cmd = f"gst-launch-1.0 {pipeline_str}"
            logger.info(f"Starting RTMP stream to {rtmp_url.split('/')[2]}")  # Hide key
            
            process = subprocess.Popen(
                cmd,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                universal_newlines=True
            )
            
            self.active_pipelines[process.pid] = process
            
            # Start statistics monitoring thread
            stats_thread = threading.Thread(
                target=self._monitor_pipeline_stats,
                args=(process,),
                daemon=True
            )
            stats_thread.start()
            
            logger.info(f"RTMP pipeline started with PID {process.pid}")
            return process.pid
                
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
    
    def _monitor_pipeline_stats(self, process):
        """Monitor GStreamer pipeline stderr for statistics"""
        import re
        import json
        import time
        from pathlib import Path
        
        stats_file = Path(__file__).parent.parent.parent / 'data' / 'stream_stats.json'
        stats = {
            'fps': 0.0,
            'bitrate': 0,
            'frames_processed': 0,
            'frames_dropped': 0,
            'stream_duration': 0,
            'last_update': time.time()
        }
        
        start_time = time.time()
        frame_count = 0
        
        try:
            for line in iter(process.stderr.readline, ''):
                if not line:
                    break
                
                # Parse identity stats for frame counts
                if 'chain' in line and 'video_stats' in line:
                    frame_count += 1
                    stats['frames_processed'] = frame_count
                
                # Parse FPS from fpsdisplaysink
                fps_match = re.search(r'rendered:\s*(\d+),\s*dropped:\s*(\d+),\s*fps:\s*([\d.]+)', line)
                if fps_match:
                    stats['frames_processed'] = int(fps_match.group(1))
                    stats['frames_dropped'] = int(fps_match.group(2))
                    stats['fps'] = float(fps_match.group(3))
                
                # Update duration
                stats['stream_duration'] = int(time.time() - start_time)
                stats['last_update'] = time.time()
                
                # Calculate approximate bitrate (from target, as actual requires tee + filesink analysis)
                stats['bitrate'] = int(stats['fps'] * 1920 * 1080 * 0.1 / 1000) if stats['fps'] > 0 else 0
                
                # Write stats every second
                if time.time() % 1 < 0.1:
                    with open(stats_file, 'w') as f:
                        json.dump(stats, f)
        except Exception as e:
            logger.error(f"Stats monitoring error: {e}")


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
