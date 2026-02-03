"""
RTMP Pipeline Manager
Manages GStreamer pipelines for encoding UDP multicast to RTMP destinations
"""
import os
import signal
import subprocess
import tempfile
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
                       rtmp_url: str, preset: Dict, input_config: Dict = None) -> str:
        """
        Build GStreamer pipeline for UDP → RTMP encoding
        
        Args:
            multicast_ip: Multicast group IP
            video_port: RTP video port
            audio_port: RTP audio port
            rtmp_url: Full RTMP destination URL
            preset: Encoding preset dict with bitrate, fps, etc.
            input_config: Optional dict containing source resolution (width, height, fps)
        
        Returns:
            GStreamer pipeline string
        """
        bitrate = preset.get('bitrate', 4500)  # kbps
        fps = preset.get('fps', 60)
        
        # Use rtpbin for proper RTP session management
        width = preset.get('width', 1920)
        height = preset.get('height', 1080)
        
        # Build dynamic caps based on input signal if available
        # Default to 1080p if not specified (safe fallback)
        src_w = input_config.get('width', 1920) if input_config else 1920
        src_h = input_config.get('height', 1080) if input_config else 1080
        src_fps = input_config.get('fps', 60) if input_config else 60
        
        # RTP raw caps require precise strings for negotiation
        # Use sampling=YCbCr-4:2:2 for UYVY (the native DeckLink format we multicast)
        video_caps = (
            f"application/x-rtp, media=(string)video, clock-rate=(int)90000, "
            f"encoding-name=(string)RAW, sampling=(string)YCbCr-4:2:2, "
            f"depth=(string)8, width=(string){src_w}, height=(string){src_h}, "
            f"framerate=(fraction){src_fps}/1"
        )
        
        # Use progressreport for reliable statistics
        pipeline = f"""
        udpsrc multicast-group={multicast_ip} port={video_port} multicast-iface="lo" caps="{video_caps}"
        ! rtpvrawdepay ! videoconvert 
        ! videoscale ! video/x-raw,width={width},height={height}
        ! progressreport name=video_stats update-freq=1 silent=false 
        ! queue max-size-buffers=3 leaky=downstream 
        ! x264enc bitrate={bitrate} speed-preset=veryfast tune=zerolatency key-int-max={fps*2}
        ! video/x-h264,profile=high ! h264parse ! queue name=v_enc
        
        udpsrc multicast-group={multicast_ip} port={audio_port} multicast-iface="lo" caps="application/x-rtp"
        ! rtpL16depay ! audioconvert ! audioresample 
        ! progressreport name=audio_stats update-freq=1 silent=false 
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
              rtmp_url: str, preset: Dict, input_config: Dict = None) -> Optional[int]:
        """
        Start RTMP encoding pipeline
        
        Returns:
            Process PID if successful, None otherwise
        """
        try:
            pipeline_str = self.build_pipeline(
                multicast_ip, video_port, audio_port, rtmp_url, preset, input_config
            )
            
            # Safe URL logging
            try:
                url_parts = rtmp_url.split('/')
                safe_url = url_parts[2] if len(url_parts) > 2 else "unknown"
                logger.info(f"Starting RTMP stream to {safe_url}")
            except:
                logger.info("Starting RTMP stream")
            
            # Redirect stdout+stderr to log file (progressreport outputs to stdout)
            stderr_log = os.path.join(tempfile.gettempdir(), f"gst_output_{os.getpid()}.log")
            
            logger.info(f"GStreamer output will be logged to: {stderr_log}")
            
            # Write command to a shell script with diagnostics
            script_file = os.path.join(tempfile.gettempdir(), f"gst_run_{os.getpid()}.sh")
            with open(script_file, 'w') as f:
                f.write("#!/bin/bash\n")
                f.write(f"echo '[DIAG] Script started at $(date)' >> {stderr_log}\n")
                f.write(f"echo '[DIAG] Running pipeline...' >> {stderr_log}\n")
                f.write(f"exec gst-launch-1.0 {pipeline_str} &>>{stderr_log}\n")
            
            os.chmod(script_file, 0o755)
            
            # Also log the full pipeline for debugging
            logger.info(f"Pipeline command: gst-launch-1.0 {pipeline_str[:200]}...")
            
            logger.info(f"Executing script: {script_file}")
            
            process = subprocess.Popen(
                [script_file],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
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
                    
                    # Parse progressreport output for video stats
                    # Format: video_stats (00:00:05): 5 seconds, 150 frames, 30 fps
                    if 'video_stats' in line:
                        logger.debug(f"Found stats line: {line.strip()}")
                        
                        # Extract FPS
                        fps_match = re.search(r'([\d\.]+)\s*fps', line)
                        if fps_match:
                            stats['fps'] = float(fps_match.group(1))
                            
                        # Extract total frames
                        frames_match = re.search(r'(\d+)\s*frames', line)
                        if frames_match:
                            current_frames = int(frames_match.group(1))
                            stats['frames_processed'] = current_frames
                        
                    # Calculate bitrate based on encoding preset if we can't get it from pipe
                    # (progressreport doesn't give bitrate directly, but gives us confirmed liveness and FPS)
                    if stats['fps'] > 0:
                        # Estimate based on FPS and resolution (proxy for health)
                        # We use the configured bitrate as base if FPS is healthy
                        target_bitrate = 4500 # Default if unknown
                        
                        # Access bitrate from intent if possible or use a calculated approximation
                        # If FPS is stable (near 30/60), assume we are hitting target bitrate
                        stats['bitrate'] = int(stats['fps'] * 100) # Placeholder calculation for now
                        
                    # Parse bitrate from x264enc if available in logs (advanced)
                    
                    # Update duration
                    current_time = time.time()
                    stats['stream_duration'] = int(current_time - start_time)
                    stats['last_update'] = current_time
                    
                    # Write stats
                    logger.info(f"Writing stats: FPS={stats['fps']}, Frames={stats['frames_processed']}")
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
