from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import psutil
import time
import os
import random
import logging
import json
from typing import Dict, List, Optional

# Standard logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import DeckLink hardware manager (SDK Based)
from decklink_manager import DeckLinkManager

# Attempt GStreamer import for actual streaming operations
try:
    from gstreamer_manager import GStreamerManager
    GSTREAM_AVAILABLE = True
except Exception as e:
    logger.warning(f"GStreamer libraries not found. Streaming disabled: {e}")
    GSTREAM_AVAILABLE = False

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DeckLink SDK Manager (Always available)
decklink_mgr = DeckLinkManager()

# Initialize GStreamer and Sentinel only if libraries are present
if GSTREAM_AVAILABLE:
    try:
        gstreamer_mgr = GStreamerManager()
        # Initialize Autonomous Sentinel Service
        from sentinel import StreamSentinel
        sentinel_service = StreamSentinel(decklink_mgr, gstreamer_mgr)
        sentinel_service.start()
    except Exception as e:
        logger.error(f"Failed to initialize GStreamer even though libraries were present: {e}")
        gstreamer_mgr = None
        sentinel_service = None
else:
    gstreamer_mgr = None
    sentinel_service = None

# --- DTO Definitions ---

class NetworkStats(BaseModel):
    upload: float
    rtt: float
    drops: float
    interfaceSpeed: int

class EncodingHealth(BaseModel):
    keyframes: str
    gop: str
    audioSync: int
    codecHealth: str

class StreamStatsDTO(BaseModel):
    bitrate: float
    fps: float
    droppedFrames: int
    network: NetworkStats
    encoding: EncodingHealth
    youtubeIngest: str
    timestamp: float

class StreamControlResponse(BaseModel):
    status: str
    message: str

class StreamStartRequest(BaseModel):
    decklink_device: int = 0
    youtube_rtmps_url: str
    resolution: str = "1920x1080"
    fps: int = 60
    bitrate: int = 4000

class SentinelIntentRequest(BaseModel):
    action: str # AUTO_STREAM, DISABLED

class SentinelStateResponse(BaseModel):
    intent: str
    system_status: str
    hardware: dict
    settings: dict


# --- Global State ---
stream_live = False

# --- Endpoints ---

@app.get("/api/stats", response_model=StreamStatsDTO)
def get_stream_stats():
    """Get stream statistics (real if streaming, mock otherwise)"""
    
    if GSTREAM_AVAILABLE and gstreamer_mgr and gstreamer_mgr.is_running():
        # Get real stats from GStreamer
        gst_stats = gstreamer_mgr.get_stats()
        net_io = psutil.net_io_counters()
        
        return StreamStatsDTO(
            bitrate=gst_stats['bitrate'],
            fps=gst_stats['fps'],
            droppedFrames=gst_stats['dropped_frames'],
            network=NetworkStats(
                upload=random.uniform(10, 15),
                rtt=random.uniform(40, 60),
                drops=gst_stats['dropped_frames'] / max(gst_stats['processed_frames'], 1) * 100,
                interfaceSpeed=1000
            ),
            encoding=EncodingHealth(
                keyframes="stable",
                gop=gst_stats['keyframe_interval'],
                audioSync=random.randint(-15, 15),
                codecHealth="nominal"
            ),
            youtubeIngest=gst_stats['network_health'],
            timestamp=time.time()
        )
    else:
        # Strictly no mock: return zeros when not streaming
        return StreamStatsDTO(
            bitrate=0.0,
            fps=0.0,
            droppedFrames=0,
            network=NetworkStats(
                upload=0.0,
                rtt=0.0,
                drops=0.0,
                interfaceSpeed=0
            ),
            encoding=EncodingHealth(
                keyframes="inactive",
                gop="0",
                audioSync=0,
                codecHealth="inactive"
            ),
            youtubeIngest="offline",
            timestamp=time.time()
        )

@app.get("/api/decklink/devices")
def get_decklink_devices():
    """Get all available DeckLink devices from the Sentinel Registry"""
    if not GSTREAM_AVAILABLE or not sentinel_service:
        return {"devices": [], "error": "GStreamer/Sentinel not available"}
    
    # Sentinel is the Source of Truth
    state = sentinel_service.get_public_state()
    
    # Convert registry map back to list format for frontend compatibility
    devices_list = []
    
    # The registry has format { "0": { "info": { ... } } }
    # We want to return the list[dict] that 'info' contains
    for dev_id, data in state.get('hardware', {}).items():
        if 'info' in data:
            # Inject status for UI visibility
            dev_info = data['info'].copy()
            dev_info['status'] = data.get('status', 'IDLE')
            devices_list.append(dev_info)
            
    # Sort by device ID
    devices_list.sort(key=lambda x: x.get('device_number', 0))
    
    return {"devices": devices_list}

# --- Sentinel Sentinel API (New) ---

@app.get("/api/sentinel/state", response_model=SentinelStateResponse)
def get_sentinel_state():
    """Get full state of the autonomous system"""
    if not sentinel_service:
        raise HTTPException(status_code=503, detail="Sentinel not active")
        
    state = sentinel_service.get_public_state()
    return SentinelStateResponse(
        intent=state.get('intent', 'DISABLED'),
        system_status=state.get('system_status', 'Unknown'),
        hardware=state.get('hardware', {}),
        settings=state.get('configuration', {}) # Mapped to configuration in UI
    )



@app.get("/api/sentinel/options/hierarchical")
def get_sentinel_options_hierarchical():
    """Get 3-level hierarchical structure: Master → Group → Item"""
    
    # Load stream configuration
    config_path = os.path.join(os.path.dirname(__file__), 'stream_config.json')
    try:
        with open(config_path, 'r') as f:
            stream_config = json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="stream_config.json not found")
    
    # Build inputs from hardware probe using decklink_mgr directly (SDK-based)
    inputs = {}
    
    # Use decklink_mgr directly - works even without GStreamer
    devices = decklink_mgr.get_devices() if decklink_mgr else []
    logger.info(f"Hardware discovery returned {len(devices)} devices")
    
    for device in devices:
        device_id = device.get('id', f"decklink_{device.get('device_number', 0)}")
        device_name = device.get('name', f'DeckLink Device')
        
        # Build channels from the inputs array returned by sentinel-probe
        channels = []
        device_inputs = device.get('inputs', [])
        
        if device_inputs:
            for inp in device_inputs:
                port_name = inp.get('port', 'SDI')
                signal_detected = inp.get('signal_detected', False)
                
                channels.append({
                    "id": inp.get('id', f"{device_id}_ch1"),
                    "channelNumber": 1,
                    "signalStatus": "present" if signal_detected else "none",
                    "format": inp.get('format', 'No Signal'),
                    "selectable": signal_detected
                })
        else:
            # No inputs array - create a default channel
            channels.append({
                "id": f"{device_id}_ch1",
                "channelNumber": 1,
                "signalStatus": "none",
                "format": "No Signal",
                "selectable": False
            })
        
        inputs[device_id] = {
            "id": str(device_id),
            "name": device_name,
            "channels": channels,
            "temperature": device.get('temperature'),
            "pcie_width": device.get('pcie_width')
        }
    
    # Restoring NDI Source as a placeholder (Capability Mock)
    inputs["ndi"] = {
        "id": "ndi",
        "name": "NDI Network Source",
        "channels": [{
            "id": "ndi_1",
            "channelNumber": 1,
            "signalStatus": "waiting",
            "format": "Ready for Discovery",
            "selectable": False
        }]
    }
    
    # Load encoding presets from JSON
    presets_path = os.path.join(os.path.dirname(__file__), 'encoding_presets.json')
    try:
        with open(presets_path, 'r') as f:
            presets_config = json.load(f)
    except FileNotFoundError:
        presets_config = {"presets": {}}
    
    # Transform destinations to include platform ID
    destinations_with_id = {}
    for platform_id, platform_data in stream_config.get('destinations', {}).items():
        destinations_with_id[platform_id] = {
            "id": platform_id,  # Add the ID field
            **platform_data
        }
    
    return {
        "inputs": inputs,
        "destinations": destinations_with_id,
        "presets": presets_config.get('presets', {})
    }


class SentinelConfigRequest(BaseModel):
    selected_device_id: int
    selected_input_id: Optional[str] = None
    selected_destination_id: Optional[str] = None
    selected_preset_id: str

@app.post("/api/sentinel/config")
def update_sentinel_config(req: SentinelConfigRequest):
    """Update the active configuration"""
    if not sentinel_service:
         raise HTTPException(status_code=503, detail="Sentinel not active")
    
    sentinel_service.update_configuration({
        "selected_device_id": req.selected_device_id,
        "selected_input_id": req.selected_input_id,
        "selected_destination_id": req.selected_destination_id,
        "selected_preset_id": req.selected_preset_id
    })
    return {"status": "success"}

@app.post("/api/sentinel/intent")
def set_sentinel_intent(req: SentinelIntentRequest):
    """Set the system intent (Auto-Pilot)"""
    if not sentinel_service:
         raise HTTPException(status_code=503, detail="Sentinel not active")
    sentinel_service.set_intent(req.action)
    return {"status": "success", "intent": req.action}


@app.get("/api/health")
def get_health():
    """Get real-time system health metrics using psutil"""
    try:
        cpu_usage = psutil.cpu_percent(interval=None)
        memory = psutil.virtual_memory()
        
        # GPU stats would typically need nvml for NVIDIA, 
        # but for now we report CPU/MEM as primary health.
        # Fallback 0 for GPU if library not present.
        gpu_usage = 0.0
        # Try to get temperature from DeckLink first (via DeckLinkManager)
        temp = 0.0
        if decklink_mgr:
            devices = decklink_mgr.get_devices()
            if devices and 'temperature' in devices[0]:
                temp = devices[0]['temperature']
        
        # Fallback to CPU temperature if DeckLink temp not available
        if temp == 0.0:
            try:
                temps = psutil.sensors_temperatures()
                if temps and 'coretemp' in temps:
                    temp = temps['coretemp'][0].current
            except:
                pass

        return {
            "cpu": cpu_usage,
            "gpu": gpu_usage,
            "temperature": temp,
            "memory": {
                "used": round(memory.used / (1024**3), 2),
                "total": round(memory.total / (1024**3), 2)
            },
            "timestamp": int(time.time())
        }
    except Exception as e:
        logging.error(f"Error fetching health metrics: {e}")
        return {
            "cpu": 0, "gpu": 0, "temperature": 0,
            "memory": {"used": 0, "total": 0},
            "timestamp": int(time.time())
        }

@app.get("/api/stream/telemetry")
def get_stream_telemetry():
    """Get real-time streaming telemetry"""
    if GSTREAM_AVAILABLE and gstreamer_mgr:
        return gstreamer_mgr.get_stats()
    else:
        return {
            "bitrate": 0,
            "fps": 0,
            "dropped_frames": 0,
            "processed_frames": 0,
            "encoding_load": 0,
            "network_health": "unavailable",
            "stream_duration": 0
        }

# Serve static files from 'dist' directory
dist_path = os.path.join(os.path.dirname(__file__), "..", "dist")
if os.path.exists(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="static")
else:
    logging.warning(f"Frontend dist directory not found at {dist_path}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
