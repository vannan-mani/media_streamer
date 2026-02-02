import gi
gi.require_version('Gst', '1.0')
from gi.repository import Gst
import logging
import sys

Gst.init(None)

def verify_real_hardware():
    print("\n" + "="*60)
    print("SEARCHING FOR REAL DECKLINK HARDWARE PORT BY PORT")
    print("="*60)
    
    real_devices = []
    
    for i in range(16):
        # Create the element
        element_name = f"verify_src_{i}"
        source = Gst.ElementFactory.make("decklinkvideosrc", element_name)
        if not source:
            print("CRITICAL ERROR: decklinkvideosrc not found.")
            return

        source.set_property("device-number", i)
        
        # Build a tiny pipeline: src -> fakesink
        pipeline = Gst.Pipeline.new(f"test_pipe_{i}")
        sink = Gst.ElementFactory.make("fakesink", f"sink_{i}")
        pipeline.add(source)
        pipeline.add(sink)
        source.link(sink)
        
        # Try to set to READY state. This IS the real test.
        # If the device number doesn't exist, this will fail.
        ret = pipeline.set_state(Gst.State.READY)
        
        if ret == Gst.StateChangeReturn.SUCCESS:
            # We found a REAL port!
            try:
                name = source.get_property("device-name")
            except:
                name = f"DeckLink Port {i}"
                
            print(f"[FOUND] Device Number {i}: {name}")
            real_devices.append({"num": i, "name": name})
            
            # Clean up
            pipeline.set_state(Gst.State.NULL)
        else:
            # Not a real device
            pass
            
    print("\n" + "="*60)
    print(f"SUMMARY: Found {len(real_devices)} physical ports.")
    for d in real_devices:
        print(f" -> Index {d['num']}: {d['name']}")
    print("="*60 + "\n")

if __name__ == "__main__":
    verify_real_hardware()
