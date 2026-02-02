import gi
gi.require_version('Gst', '1.0')
from gi.repository import Gst, GLib
import threading
import time
from typing import Dict, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GStreamerManager:
    """Manages GStreamer pipeline for YouTube RTMPS streaming with telemetry"""
    
    def __init__(self):
        logger.info("Initializing GStreamerManager")
        Gst.init(None)
        self.pipeline: Optional[Gst.Pipeline] = None
        self.loop: Optional[GLib.MainLoop] = None
        self.running = False
        self.active_device = None
        self.stats = {
            'bitrate': 0,
            'fps': 0,
            'dropped_frames': 0,
            'processed_frames': 0,
            'encoding_load': 0,
            'network_health': 'good',
            'stream_duration': 0,
            'keyframe_interval': '2.0s'
        }
        self.start_time = None
        self.last_buffer_size = 0
        self.last_buffer_time = 0
        
    def build_pipeline(self, 
                      decklink_device: int = 0,
                      youtube_rtmps_url: str = None,
                      resolution: str = "1920x1080",
                      fps: int = 60,
                      bitrate: int = 4000):
        """
        Build GStreamer pipeline for YouTube RTMPS streaming
        """
        self.active_device = decklink_device
        logger.info(f"Building pipeline: device={decklink_device}, resolution={resolution}, fps={fps}, bitrate={bitrate}")
        
        if not youtube_rtmps_url:
            raise ValueError("YouTube RTMPS URL is required")
        
        width, height = resolution.split('x')
        keyframe_interval = fps * 2  # 2 seconds as recommended by YouTube
        
        pipeline_str = f"""
        decklinkvideosrc device-number={decklink_device} mode=auto connection=auto !
        queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 !
        videoconvert !
        videoscale !
        videorate !
        video/x-raw,width={width},height={height},framerate={fps}/1 !
        x264enc name=video_encoder
            bitrate={bitrate}
            key-int-max={keyframe_interval}
            tune=zerolatency
            speed-preset=ultrafast
            threads=4 !
        h264parse !
        flvmux name=mux streamable=true !
        rtmpsink name=rtmp_sink location="{youtube_rtmps_url}" sync=false
        
        decklinkaudiosrc device-number={decklink_device} !
        queue !
        audioconvert !
        audioresample !
        audio/x-raw,rate=44100,channels=2 !
        voaacenc bitrate=128000 !
        mux.
        """
        
        try:
            self.pipeline = Gst.parse_launch(pipeline_str)
            self._setup_telemetry()
            logger.info("Pipeline built successfully")
        except Exception as e:
            logger.error(f"Failed to build pipeline: {e}")
            raise
        
    def _setup_telemetry(self):
        """
        Set up real-time telemetry monitoring using probes and bus messages
        """
        logger.info("Setting up telemetry monitoring")
        
        # Get video encoder for stats
        video_enc = self.pipeline.get_by_name("video_encoder")
        if video_enc:
            # Add probe to monitor buffers for bitrate calculation
            video_pad = video_enc.get_static_pad("src")
            if video_pad:
                video_pad.add_probe(
                    Gst.PadProbeType.BUFFER,
                    self._buffer_probe_callback
                )
                logger.info("Buffer probe attached to video encoder")
        
        # Monitor bus for QoS events, errors, warnings
        bus = self.pipeline.get_bus()
        bus.add_signal_watch()
        bus.connect("message::qos", self._on_qos_message)
        bus.connect("message::error", self._on_error_message)
        bus.connect("message::warning", self._on_warning_message)
        bus.connect("message::eos", self._on_eos_message)
        bus.connect("message::element", self._on_element_message)
        logger.info("Bus message handlers connected")
        
    def _on_element_message(self, bus, message):
        """
        Handle element-specific messages, particularly DeckLink signal changes
        """
        struct = message.get_structure()
        if struct and struct.get_name() == "decklink-video-input-signal-changed":
            present = struct.get_value("present")
            if not present:
                logger.warning("HARDWARE ALERT: DeckLink Signal LOST during transmission!")
                self.stats['network_health'] = 'no_signal'
            else:
                logger.info("HARDWARE ALERT: DeckLink Signal Restored.")
                self.stats['network_health'] = 'good'
        
    def _buffer_probe_callback(self, pad, info):
        """
        Probe callback to monitor buffers passing through for bitrate calculation
        """
        buffer = info.get_buffer()
        if buffer:
            size = buffer.get_size()
            pts = buffer.pts
            
            # Calculate bitrate (bits per second)
            current_time = time.time()
            if self.last_buffer_time > 0:
                time_delta = current_time - self.last_buffer_time
                if time_delta > 0:
                    # bitrate in kbps
                    bitrate = (size * 8) / (time_delta * 1000)
                    # Smooth the bitrate calculation with exponential moving average
                    alpha = 0.1
                    self.stats['bitrate'] = int((1 - alpha) * self.stats['bitrate'] + alpha * bitrate)
            
            self.last_buffer_size = size
            self.last_buffer_time = current_time
            self.stats['processed_frames'] += 1
            
        return Gst.PadProbeReturn.OK
        
    def _on_qos_message(self, bus, message):
        """
        Handle QoS events for dropped frames and performance metrics
        """
        try:
            qos_values = message.parse_qos_values()
            if qos_values:
                # Update dropped frames count
                # Note: QoS stats structure varies by GStreamer version
                logger.debug(f"QoS event: {qos_values}")
        except Exception as e:
            logger.debug(f"Error parsing QoS message: {e}")
            
    def _on_error_message(self, bus, message):
        """
        Handle pipeline errors
        """
        err, debug = message.parse_error()
        logger.error(f"Pipeline error: {err.message}")
        logger.debug(f"Debug info: {debug}")
        self.stats['network_health'] = 'error'
        
        # Attempt recovery for network errors
        if "network" in err.message.lower() or "connection" in err.message.lower():
            logger.info("Network error detected, attempting reconnection...")
            self._attempt_reconnect()
            
    def _on_warning_message(self, bus, message):
        """
        Handle pipeline warnings
        """
        warn, debug = message.parse_warning()
        logger.warning(f"Pipeline warning: {warn.message}")
        
        if "drop" in warn.message.lower():
            self.stats['dropped_frames'] += 1
            
    def _on_eos_message(self, bus, message):
        """
        Handle end-of-stream
        """
        logger.info("End of stream reached")
        self.stop()
        
    def _attempt_reconnect(self):
        """
        Attempt to reconnect to YouTube after network error
        """
        logger.info("Attempting to reconnect...")
        self.pipeline.set_state(Gst.State.NULL)
        time.sleep(5)
        self.pipeline.set_state(Gst.State.PLAYING)
        
    def start(self):
        """
        Start streaming pipeline
        """
        if not self.pipeline:
            raise Exception("Pipeline not built. Call build_pipeline() first.")
            
        logger.info("Starting pipeline...")
        ret = self.pipeline.set_state(Gst.State.PLAYING)
        
        if ret == Gst.StateChangeReturn.FAILURE:
            logger.error("Unable to set pipeline to PLAYING state")
            raise Exception("Failed to start pipeline")
            
        self.running = True
        self.start_time = time.time()
        
        # Run GLib main loop in separate thread
        self.loop = GLib.MainLoop()
        thread = threading.Thread(target=self.loop.run, daemon=True)
        thread.start()
        
        logger.info("Pipeline started successfully")
        
    def stop(self):
        """
        Stop streaming pipeline
        """
        logger.info("Stopping pipeline...")
        
        if self.pipeline:
            self.pipeline.set_state(Gst.State.NULL)
            
        if self.loop:
            self.loop.quit()
            
        self.running = False
        self.start_time = None
        self.active_device = None
        
        logger.info("Pipeline stopped")
        
    def get_stats(self) -> Dict:
        """
        Get current streaming statistics
        """
        # Update stream duration
        if self.start_time and self.running:
            self.stats['stream_duration'] = int(time.time() - self.start_time)
            
        # Calculate FPS from processed frames and duration
        if self.stats['stream_duration'] > 0:
            self.stats['fps'] = int(self.stats['processed_frames'] / self.stats['stream_duration'])
            
        return self.stats
    
    def is_running(self) -> bool:
        """
        Check if pipeline is currently running
        """
        return self.running
    
    def adjust_bitrate(self, new_bitrate: int):
        """
        Dynamically adjust encoding bitrate
        """
        encoder = self.pipeline.get_by_name("video_encoder")
        if encoder:
            encoder.set_property("bitrate", new_bitrate)
            logger.info(f"Bitrate adjusted to {new_bitrate} kbps")
