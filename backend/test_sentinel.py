import unittest
import json
import time
import sys
from unittest.mock import MagicMock, patch

# Mock GStreamer dependencies globally for local testing
mock_gst = MagicMock()
mock_gst.init.return_value = None
mock_gi_repo = MagicMock()
mock_gi_repo.Gst = mock_gst

# Patch module imports
sys.modules['gi'] = MagicMock()
sys.modules['gi.repository'] = mock_gi_repo

from sentinel import StreamSentinel

class TestStreamSentinel(unittest.TestCase):
    def setUp(self):
        # Mock Dependencies
        self.mock_decklink = MagicMock()
        self.mock_gstreamer = MagicMock()
        
        # Setup Default Mock Returns
        self.mock_gstreamer.is_running.return_value = False
        self.mock_gstreamer.active_device = None
        self.mock_decklink.get_devices.return_value = []
        
        # Initialize Sentinel with Mocks
        self.sentinel = StreamSentinel(self.mock_decklink, self.mock_gstreamer)
        # Disable threaded loop for unit tests, we call _reconcile manually
        self.sentinel.running = True 

    def test_initial_state(self):
        """Verify default state is clean"""
        state = self.sentinel.get_public_state()
        self.assertEqual(state['intent'], "DISABLED")
        self.assertEqual(state['hardware'], {})

    def test_scanner_mode_no_signal(self):
        """Verify Sentinel probes hardware when IDLE"""
        # Scenario: One card, no signal
        self.mock_decklink.get_devices.return_value = [{
            "device_number": 0,
            "inputs": [{"signal_detected": False}]
        }]
        
        # Run one logic cycle
        self.sentinel._reconcile()
        
        # Check Hardware Registry
        state = self.sentinel.get_public_state()
        self.assertIn("0", state['hardware'])
        self.assertEqual(state['hardware']['0']['status'], "IDLE")
        
        # Check Intent Logic: Should remain IDLE
        self.mock_gstreamer.start.assert_not_called()

    def test_auto_start_logic(self):
        """Verify Sentinel starts stream when Intent=AUTO and Signal Found"""
        # 1. Set Intent and Required Settings
        self.sentinel.set_intent("AUTO_STREAM")
        self.sentinel.update_settings({"youtube_url": "rtmp://mock"})
        
        # 2. Simulate Signal
        self.mock_decklink.get_devices.return_value = [{
            "device_number": 0,
            "inputs": [{"signal_detected": True, "format": "1080p60", "device_number": 0}]
        }]
        
        # 3. Reconcile
        self.sentinel._reconcile()
        
        # 4. Assert Pipeline Start
        self.mock_gstreamer.build_pipeline.assert_called_once()
        self.mock_gstreamer.start.assert_called_once()
        
        # 5. Check System Status
        state = self.sentinel.get_public_state()
        self.assertEqual(state['system_status'], "Streaming Active")

    def test_monitor_mode_skips_active_device(self):
        """Verify Sentinel does NOT probe the active streaming device"""
        # 1. Simulate Streaming State
        self.mock_gstreamer.is_running.return_value = True
        self.mock_gstreamer.active_device = 0
        self.sentinel.set_intent("AUTO_STREAM")
        
        # 2. Reconcile
        self.sentinel._reconcile()
        
        # 3. Assert Probe skipped device 0
        active_args = self.mock_decklink.get_devices.call_args[1] # kwargs
        self.assertIn(0, active_args['ignore_indices'])
        
    def test_auto_stop_on_intent_change(self):
        """Verify stream stops if user changes intent to DISABLED"""
        # 1. Simulate Streaming State
        self.mock_gstreamer.is_running.return_value = True
        self.sentinel.set_intent("DISABLED")
        
        # 2. Reconcile
        self.sentinel._reconcile()
        
        # 3. Assert Stop
        self.mock_gstreamer.stop.assert_called_once()

if __name__ == '__main__':
    unittest.main()
