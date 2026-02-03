"""
Sentinel API Gateway (Service-Oriented Architecture v2.0)
Minimal REST API that coordinates between Input, Uplink, and Preview services via shared JSON state
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os
import json
import logging
from typing import Optional

import psutil

from shared.config_manager import ConfigManager
from shared.logger import setup_logger

logger = setup_logger('sentinel-api')

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared configuration manager
config = ConfigManager()

# Load static configurations
def load_stream_config():
    """Load stream destinations"""
    config_path = os.path.join(os.path.dirname(__file__), 'stream_config.json')
    with open(config_path, 'r') as f:
        return json.load(f)

def load_encoding_presets():
    """Load encoding presets"""
    presets_path = os.path.join(os.path.dirname(__file__), 'encoding_presets.json')
    with open(presets_path, 'r') as f:
        return json.load(f)

# Pydantic Models
class SentinelConfigRequest(BaseModel):
    selected_device_id: int
    selected_input_id: Optional[str] = None
    selected_destination_id: Optional[str] = None
    selected_preset_id: str

class IntentRequest(BaseModel):
    intent: str  # "AUTO_STREAM" or "DISABLED"

# API Endpoints
@app.get("/api/sentinel/state")
def get_state():
    """Get aggregated state from all services"""
    intent_data = config.read('intent.json', {})
    registry = config.read('device_registry.json', {'devices': {}})
    
    # Extract settings from intent
    configuration = intent_data.get('configuration', {})
    settings = {
        'selected_device_id': configuration.get('selected_device_id', 0),
        'selected_input_id': configuration.get('selected_input_id'),
        'selected_destination_id': configuration.get('selected_destination_id'),
        'selected_preset_id': configuration.get('selected_preset_id', 'hd_high')
    }
    
    # Check if any inputs are streaming
    system_status = "No Signal"
    for device in registry.get('devices', {}).values():
        for inp in device.get('inputs', []):
            if inp.get('signal_detected'):
                if inp.get('udp', {}).get('status') == 'streaming':
                    system_status = "Ready to Stream"
                else:
                    system_status = "Signal Detected"
                break
    
    # Check if actively streaming to RTMP
    if intent_data.get('intent') == 'AUTO_STREAM':
        system_status = "Streaming Live"
    
    return {
        "intent": intent_data.get('intent', 'DISABLED'),
        "settings": settings,
        "hardware": registry.get('devices', {}),
        "system_status": system_status
    }

@app.post("/api/sentinel/intent")
def set_intent(request: IntentRequest):
    """Set streaming intent (GO LIVE / STOP)"""
    intent_data = config.read('intent.json', {})
    intent_data['intent'] = request.intent
    config.write('intent.json', intent_data)
    
    logger.info(f"Intent set to: {request.intent}")
    return {"status": "ok", "intent": request.intent}

@app.post("/api/sentinel/configure")
def configure(request: SentinelConfigRequest):
    """Update configuration (input, destination, preset selection)"""
    intent_data = config.read('intent.json', {})
    
    intent_data['configuration'] = {
        'selected_device_id': request.selected_device_id,
        'selected_input_id': request.selected_input_id,
        'selected_destination_id': request.selected_destination_id,
        'selected_preset_id': request.selected_preset_id
    }
    
    config.write('intent.json', intent_data)
    
    logger.info(f"Configuration updated: {request.selected_input_id} → {request.selected_destination_id}")
    return {"status": "ok"}

@app.get("/api/sentinel/options/hierarchical")
def get_hierarchical_options():
    """Get hierarchical configuration options for UI"""
    registry = config.read('device_registry.json', {'devices': {}})
    stream_config = load_stream_config()
    presets_config = load_encoding_presets()
    
    # Transform device registry into input device format
    inputs = {}
    for device_id, device_data in registry.get('devices', {}).items():
        device_number = device_data.get('device_number', 0)
        inputs[device_id] = {
            "id": device_id,
            "name": device_data.get('name', f'Device {device_number}'),
            "channels": [
                {
                    "id": inp['id'],
                    "channelNumber": idx,
                    "signalStatus": "present" if inp.get('signal_detected') else "none",
                    "format": inp.get('format'),
                    "selectable": inp.get('signal_detected', False)
                }
                for idx, inp in enumerate(device_data.get('inputs', []))
            ]
        }
    
    # Transform destinations to include platform ID
    destinations_with_id = {}
    for platform_id, platform_data in stream_config.get('destinations', {}).items():
        destinations_with_id[platform_id] = {
            "id": platform_id,
            **platform_data
        }
    
    return {
        "inputs": inputs,
        "destinations": destinations_with_id,
        "presets": presets_config.get('presets', {})
    }

@app.get("/api/stream/telemetry")
def get_stream_telemetry():
    """Get real-time streaming statistics from active pipeline"""
    intent_data = config.read('intent.json', {})
    
    # Check if actively streaming
    if intent_data.get('intent') != 'AUTO_STREAM':
        return {
            "bitrate": 0,
            "fps": 0,
            "dropped_frames": 0,
            "processed_frames": 0,
            "encoding_load": 0,
            "network_health": "idle",
            "stream_duration": 0,
            "keyframe_interval": "N/A"
        }
    
    # Read actual statistics from uplink pipeline
    stats = config.read('stream_stats.json', {
        'fps': 0.0,
        'bitrate': 0,
        'frames_processed': 0,
        'frames_dropped': 0,
        'stream_duration': 0
    })
    
    # Determine network health based on actual performance
    network_health = "excellent"
    if stats.get('frames_dropped', 0) > 100:
        network_health = "poor"
    elif stats.get('frames_dropped', 0) > 10:
        network_health = "fair"
    
    # Get selected preset for keyframe interval calculation
    configuration = intent_data.get('configuration', {})
    preset_id = configuration.get('selected_preset_id', 'hd_high')
    
    presets_config = load_encoding_presets()
    target_fps = 60
    for quality_group in presets_config.get('presets', {}).values():
        for variant in quality_group.get('variants', []):
            if variant['id'] == preset_id:
                target_fps = variant.get('fps', 60)
                break
    
    return {
        "bitrate": stats.get('bitrate', 0),
        "fps": round(stats.get('fps', 0), 1),
        "dropped_frames": stats.get('frames_dropped', 0),
        "processed_frames": stats.get('frames_processed', 0),
        "encoding_load": round(psutil.cpu_percent(interval=None), 1),
        "network_health": network_health,
        "stream_duration": stats.get('stream_duration', 0),
        "keyframe_interval": f"{target_fps * 2} frames"
    }


# Health check
@app.get("/api/health")
def health_check():
    mem = psutil.virtual_memory()
    
    # Get temperature (if available)
    temp = 0
    try:
        temps = psutil.sensors_temperatures()
        if temps and 'coretemp' in temps:
            temp = int(temps['coretemp'][0].current)
    except:
        pass
    
    return {
        "status": "healthy",
        "service": "sentinel-api",
        "version": "2.0.0",
        "cpu": round(psutil.cpu_percent(interval=1), 1),
        "gpu": 0, # Placeholder until nvidia-smi integration
        "temperature": temp,
        "memory": {
            "used": mem.used,
            "total": mem.total,
            "percent": mem.percent
        }
    }

# Serve frontend
dist_path = os.path.join(os.path.dirname(__file__), "../dist")
if os.path.exists(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="static")
    logger.info("Serving frontend from /dist")
else:
    logger.warning("Frontend dist/ not found. Run 'npm run build' to create it.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
