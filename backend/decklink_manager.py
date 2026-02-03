from typing import List, Dict, Optional
import time
import logging
import os

import subprocess
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DeckLinkManager:
    """Manages DeckLink device detection and enumeration using the Sentinel SDK Probe"""
    
    def __init__(self):
        logger.info("Initializing DeckLinkManager (SDK Mode)")
        # Path to the compiled SDK tool for Ubuntu
        self.sdk_tool_path = os.path.join(os.path.dirname(__file__), "cpp", "sentinel-probe")
        
    def get_devices(self, ignore_indices: List[int] = None) -> List[Dict]:
        """
        Enumerate all available DeckLink devices using the C++ SDK bridge.
        """
        if ignore_indices is None:
            ignore_indices = []

        # Attempt discovery via C++ SDK tool (Ubuntu)
        if os.path.exists(self.sdk_tool_path):
            try:
                logger.info(f"Running Sentinel SDK Probe at {self.sdk_tool_path}")
                result = subprocess.run([self.sdk_tool_path], capture_output=True, text=True, timeout=2)
                if result.returncode == 0:
                    devices = json.loads(result.stdout)
                    # Filter ignored indices
                    return [d for d in devices if d['device_number'] not in ignore_indices]
                else:
                    logger.error(f"Sentinel Probe failed with code {result.returncode}: {result.stderr}")
            except Exception as e:
                logger.error(f"Sentinel Probe execution error: {e}")
        else:
            logger.warning(f"Sentinel Probe binary not found at {self.sdk_tool_path}. No hardware discovered.")

        return []
    
    def detect_signal(self, device_num: int) -> Dict:
        """
        Detect signal presence and format on a specific device
        """
        # Actual detection is handled via the full inventory probe
        return {
            "signal_detected": False,
            "format": "No Signal",
            "connection_type": "SDI"
        }
