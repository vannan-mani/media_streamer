"""
Shared Configuration Manager
Provides thread-safe access to JSON configuration files
"""
import json
import os
from typing import Any, Dict
from threading import Lock

class ConfigManager:
    """Manages read/write access to JSON state files"""
    
    def __init__(self, base_path: str = None):
        self.base_path = base_path or os.path.join(os.path.dirname(__file__), '..', 'data')
        self.locks: Dict[str, Lock] = {}
        
    def _get_lock(self, filename: str) -> Lock:
        """Get or create a lock for a specific file"""
        if filename not in self.locks:
            self.locks[filename] = Lock()
        return self.locks[filename]
    
    def read(self, filename: str, default: Any = None) -> Any:
        """Thread-safe read from JSON file"""
        filepath = os.path.join(self.base_path, filename)
        lock = self._get_lock(filename)
        
        with lock:
            try:
                if os.path.exists(filepath):
                    with open(filepath, 'r', encoding='utf-8') as f:
                        return json.load(f)
                return default if default is not None else {}
            except Exception as e:
                print(f"Error reading {filename}: {e}")
                return default if default is not None else {}
    
    def write(self, filename: str, data: Any) -> bool:
        """Thread-safe write to JSON file"""
        filepath = os.path.join(self.base_path, filename)
        lock = self._get_lock(filename)
        
        with lock:
            try:
                os.makedirs(os.path.dirname(filepath), exist_ok=True)
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2)
                return True
            except Exception as e:
                print(f"Error writing {filename}: {e}")
                return False
    
    def update(self, filename: str, updates: Dict) -> bool:
        """Thread-safe partial update (merge)"""
        lock = self._get_lock(filename)
        
        with lock:
            data = self.read(filename, {})
            data.update(updates)
            return self.write(filename, data)
