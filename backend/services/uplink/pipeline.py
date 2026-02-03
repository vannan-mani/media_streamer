"""
RTMP Pipeline Manager
Manages GStreamer pipelines for encoding UDP multicast to RTMP destinations
"""
import os
import signal
import subprocess
import threading
from typing import Optional, Dict
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))
from shared.logger import setup_logger
from shared.config_manager import ConfigManager

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
        ! identity name=video_stats silent=false datarate=1
        ! queue max-size-buffers=3 leaky=downstream 
        ! x264enc bitrate={bitrate} speed-preset=veryfast tune=zerolatency key-int-max={fps*2}
        ! video/x-h264,profile=high ! h264parse ! queue name=v_enc
        
        udpsrc multicast-group={multicast_ip} port={audio_port} multicast-iface="lo" caps="application/x-rtp"
        ! rtp.recv_rtp_sink_1
        rtp. ! rtpL16depay ! audioconvert ! audioresample 
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
            
            # Safe URL logging
            try:
                url_parts = rtmp_url.split('/')
                safe_url = url_parts[2] if len(url_parts) > 2 else "unknown"
                logger.info(f"Starting RTMP stream to {safe_url}")
            except:
                logger.info("Starting RTMP stream")
            
            # Use shell=True because pipeline_str contains complex quoted arguments
            # Redirect stderr to a log file since shell=True prevents direct stderr pipe access
            import tempfile
            stderr_log = os.path.join(tempfile.gettempdir(), f"gst_stderr_{os.getpid()}.log")
            
            logger.info(f"GStreamer stderr will be logged to: {stderr_log}")
            
            # Set GST_DEBUG as environment variable
            env = os.environ.copy()
            env["GST_DEBUG"] = "identity:6"
            env["GST_DEBUG_NO_COLOR"] = "1"  # Easier parsing
            
            # CRITICAL: Wrap in bash -c so 2> redirect applies to gst-launch, not the outer shell
            cmd = f'bash -c "gst-launch-1.0 {pipeline_str} 2>{stderr_log}"'
            
            process = subprocess.Popen(
                cmd,
                shell=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                env=env,  # Pass environment with GST_DEBUG
                preexec_fn=os.setsid if os.name != 'nt' else None
            )
            
            self.active_pipelines[process.pid] = process
            
            # Start statistics monitoring thread
            stats_thread = threading.Thread(
                target=self._monitor_pipeline_stats,
                args=(stderr_log,),  # Pass log file path instead of process
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
    
    def _monitor_pipeline_stats(self, stderr_log_path):
        """Monitor GStreamer pipeline stderr from log file"""
        import re
        import time
        
        # Use shared config manager to write stats
        stats_mgr = ConfigManager()
        
        logger.info(f"Stats monitoring thread started, tailing {stderr_log_path}")
        
        stats = {
            'fps': 0.0,
            'bitrate': 0,
            'frames_processed': 0,
            'frames_dropped': 0,
            'stream_duration': 0,
            'last_update': time.time()
        }
        
        start_time = time.time()
        byte_count = 0
        last_byte_update = time.time()
        line_count = 0
        
        # Wait for log file to be created
        max_wait = 5
        waited = 0
        while not os.path.exists(stderr_log_path) and waited < max_wait:
            time.sleep(0.1)
            waited += 0.1
        
        if not os.path.exists(stderr_log_path):
            logger.error(f"Log file {stderr_log_path} never created!")
            return
        
        logger.info("Entering stderr read loop...")
        
        try:
            with open(stderr_log_path, 'r') as f:
                # Start at beginning of file
                f.seek(0)
                
                while True:
                    line = f.readline()
                    
                    if not line:
                        # No new data, sleep briefly
                        time.sleep(0.01)
                        continue
                    
                    line_count += 1
                    
                    # Log every 100 lines to show activity
                    if line_count % 100 == 0:
                        logger.info(f"Read {line_count} lines from stderr")
                    
                    # Log first few lines to verify output
                    if line_count <= 5:
                        logger.debug(f"stderr line {line_count}: {line[:100]}")
                    
                    # Parse identity stats for frame counts and bytes
                    if 'video_stats' in line and 'chain' in line:
                        logger.debug(f"Found video_stats line")
                        size_match = re.search(r'\((\d+)\s+bytes', line)
                        if size_match:
                            size = int(size_match.group(1))
                            byte_count += size
                            stats['frames_processed'] += 1
                            logger.debug(f"Parsed frame: size={size}, total_frames={stats['frames_processed']}")
                    
                    # Parse FPS from fpsdisplaysink
                    fps_match = re.search(r'rendered:\s*(\d+),\s*dropped:\s*(\d+),\s*fps:\s*([\d.]+)', line)
                    if not fps_match:
                        fps_match = re.search(r'current-fps:\s*([\d.]+)', line)
                    
                    if fps_match:
                        logger.debug(f"Found FPS line")
                        if len(fps_match.groups()) >= 3:
                            stats['frames_processed'] = int(fps_match.group(1))
                            stats['frames_dropped'] = int(fps_match.group(2))
                            stats['fps'] = float(fps_match.group(3))
                        else:
                            stats['fps'] = float(fps_match.group(1))
                    
                    # Update duration
                    current_time = time.time()
                    stats['stream_duration'] = int(current_time - start_time)
                    stats['last_update'] = current_time
                    
                    # Calculate actual bitrate every second
                    if current_time - last_byte_update >= 1.0:
                        stats['bitrate'] = int((byte_count * 8) / (current_time - last_byte_update) / 1024)  # kbps
                        byte_count = 0
                        last_byte_update = current_time
                        
                        # Also update FPS if not getting it from fpsdisplaysink
                        if stats['fps'] == 0 and stats['stream_duration'] > 0:
                            stats['fps'] = round(stats['frames_processed'] / stats['stream_duration'], 1)

                        # Write stats
                        logger.info(f"Writing stats: FPS={stats['fps']}, Bitrate={stats['bitrate']}kbps, Frames={stats['frames_processed']}")
                        stats_mgr.write('stream_stats.json', stats)
                    
        except Exception as e:
            logger.error(f"Stats monitoring error: {e}", exc_info=True)
        
        logger.warning(f"Stats monitoring thread exiting. Read {line_count} lines total.")


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
