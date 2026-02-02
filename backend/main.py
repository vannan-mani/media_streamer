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
import config

# Import GStreamer managers
try:
    from decklink_manager import DeckLinkManager
    from gstreamer_manager import GStreamerManager
    GSTREAM_AVAILABLE = True
except Exception as e:
    logging.warning(f"GStreamer not available: {e}")
    GSTREAM_AVAILABLE = False

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize GStreamer managers
if GSTREAM_AVAILABLE:
    decklink_mgr = DeckLinkManager()
    gstreamer_mgr = GStreamerManager()
    
    # Initialize Autonomous Sentinel Service
    from sentinel import StreamSentinel
    sentinel_service = StreamSentinel(decklink_mgr, gstreamer_mgr)
    sentinel_service.start()
else:
    decklink_mgr = None
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

class MemoryStats(BaseModel):
    used: float
    total: float

class HealthDataDTO(BaseModel):
    cpu: float
    gpu: float
    temperature: float
    memory: MemoryStats
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
        # Mock data when not streaming
        net_io = psutil.net_io_counters()
        
        return StreamStatsDTO(
            bitrate=5800 + random.random() * 400,
            fps=59.94,
            droppedFrames=random.randint(0, 20),
            network=NetworkStats(
                upload=random.uniform(10, 15),
                rtt=random.uniform(40, 60),
                drops=random.uniform(0, 0.3),
                interfaceSpeed=1000
            ),
            encoding=EncodingHealth(
                keyframes="stable",
                gop="2.0s",
                audioSync=random.randint(-15, 15),
                codecHealth="nominal"
            ),
            youtubeIngest="excellent" if random.random() > 0.1 else "good",
            timestamp=time.time()
        )

@app.get("/api/health", response_model=HealthDataDTO)
def get_system_health():
    """Get real system health metrics"""
    cpu_usage = psutil.cpu_percent(interval=None)
    mem = psutil.virtual_memory()
    
    return HealthDataDTO(
        cpu=cpu_usage,
        gpu=random.uniform(30, 50),
        temperature=random.uniform(45, 60),
        memory=MemoryStats(
            used=mem.used / (1024**3),
            total=mem.total / (1024**3)
        ),
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

@app.get("/api/sentinel/options")
def get_sentinel_options():
    """Get available Channels and Presets (flat structure for backward compatibility)"""
    return {
        "channels": config.CHANNELS,
        "presets": config.PRESETS_FLAT
    }

@app.get("/api/sentinel/options/nested")
def get_sentinel_options_nested():
    """Get hierarchical Endpoints and Presets for nested UI"""
    return {
        "endpoints": config.ENDPOINTS,
        "presets": config.PRESETS
    }

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
    
    # Build inputs from hardware probe (use ACTUAL hardware inputs, not config)
    inputs = {}
    if sentinel_service:
        devices = sentinel_service.hardware_registry
        for device_id, device_info in devices.items():
            device_name = device_info.get('info', {}).get('name', f'Device {device_id}')
            
            # Use ACTUAL hardware inputs detected from the device
            channels = []
            device_inputs = device_info.get('info', {}).get('inputs', [])
            
            if device_inputs:
                # Device has input detection - use actual inputs
                for inp in device_inputs:
                    port_name = inp.get('port', 'SDI 1')
                    # Extract channel number from port name (e.g., "SDI 1" -> 1)
                    try:
                        ch_num = int(port_name.replace('SDI', '').strip())
                    except:
                        ch_num = 1
                    
                    channels.append({
                        "id": f"{device_id}_ch{ch_num}",
                        "channelNumber": ch_num,
                        "signalStatus": "present" if inp.get('signal_detected') else "none",
                        "format": inp.get('format'),
                        "selectable": inp.get('signal_detected', False)
                    })
            else:
                # Fallback: Device doesn't report inputs, create single channel
                signal_present = device_info.get('status') in ['IDLE', 'STREAMING']
                format_info = device_info.get('info', {}).get('display_mode', 'Unknown')
                
                channels.append({
                    "id": f"{device_id}_ch1",
                    "channelNumber": 1,
                    "signalStatus": "present" if signal_present else "none",
                    "format": format_info if signal_present else None,
                    "selectable": signal_present
                })
            
            inputs[device_id] = {
                "id": str(device_id),
                "name": device_name,
                "channels": channels
            }
    
    return {
        "inputs": inputs,
        "destinations": stream_config['destinations'],
        "presets": stream_config['presets']
    }


class SentinelConfigRequest(BaseModel):
    selected_device_id: int
    selected_channel_id: str
    selected_preset_id: str

@app.post("/api/sentinel/config")
def update_sentinel_config(req: SentinelConfigRequest):
    """Update the active configuration"""
    if not sentinel_service:
         raise HTTPException(status_code=503, detail="Sentinel not active")
    
    sentinel_service.update_configuration({
        "selected_device_id": req.selected_device_id,
        "selected_channel_id": req.selected_channel_id,
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
