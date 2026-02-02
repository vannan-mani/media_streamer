# config.py

# Available Streaming Destinations (Grouped by Platform for Nested UI)
ENDPOINTS = {
    "youtube": {
        "name": "YouTube",
        "icon": "youtube",
        "channels": [
            {
                "id": "yt_channel_1",
                "name": "Main Channel",
                "description": "Primary broadcast channel",
                "url": "rtmp://a.rtmp.youtube.com/live2/YOUR_STREAM_KEY_1"
            },
            {
                "id": "yt_channel_2",
                "name": "Channel 2",
                "description": "Secondary channel",
                "url": "rtmp://a.rtmp.youtube.com/live2/YOUR_STREAM_KEY_2"
            },
            {
                "id": "yt_events",
                "name": "Event Stream",
                "description": "Special events",
                "url": "rtmp://a.rtmp.youtube.com/live2/YOUR_STREAM_KEY_EVENTS"
            }
        ]
    },
    "facebook": {
        "name": "Facebook",
        "icon": "facebook",
        "channels": [
            {
                "id": "fb_page",
                "name": "Page Live",
                "description": "Facebook page stream",
                "url": "rtmps://live-api-s.facebook.com:443/rtmp/YOUR_FB_KEY"
            },
            {
                "id": "fb_group",
                "name": "Group Stream",
                "description": "Private group broadcast",
                "url": "rtmps://live-api-s.facebook.com:443/rtmp/YOUR_FB_GROUP_KEY"
            }
        ]
    }
}

# Encoding Quality Presets (Grouped by Quality Category for Nested UI)
PRESETS = {
    "4k": {
        "name": "4K Ultra HD",
        "description": "4K resolution options",
        "variants": [
            {
                "id": "4k_high",
                "name": "High Bitrate",
                "description": "Maximum quality 4K",
                "width": 3840,
                "height": 2160,
                "fps": 30,
                "bitrate": 20000
            },
            {
                "id": "4k_medium",
                "name": "Medium Bitrate",
                "description": "Balanced 4K",
                "width": 3840,
                "height": 2160,
                "fps": 30,
                "bitrate": 15000
            }
        ]
    },
    "hd": {
        "name": "Full HD 1080p",
        "description": "1080p resolution options",
        "variants": [
            {
                "id": "hd_high",
                "name": "High Bitrate",
                "description": "1080p60 maximum quality",
                "width": 1920,
                "height": 1080,
                "fps": 60,
                "bitrate": 6000
            },
            {
                "id": "hd_medium",
                "name": "Medium Bitrate",
                "description": "1080p60 balanced",
                "width": 1920,
                "height": 1080,
                "fps": 60,
                "bitrate": 4500
            },
            {
                "id": "hd_low",
                "name": "Low Bitrate",
                "description": "1080p30 efficient",
                "width": 1920,
                "height": 1080,
                "fps": 30,
                "bitrate": 3000
            }
        ]
    },
    "sd": {
        "name": "HD 720p",
        "description": "720p resolution options",
        "variants": [
            {
                "id": "sd_high",
                "name": "High Bitrate",
                "description": "720p60 quality",
                "width": 1280,
                "height": 720,
                "fps": 60,
                "bitrate": 4000
            },
            {
                "id": "sd_medium",
                "name": "Medium Bitrate",
                "description": "720p60 balanced",
                "width": 1280,
                "height": 720,
                "fps": 60,
                "bitrate": 3000
            },
            {
                "id": "sd_low",
                "name": "Low Bitrate",
                "description": "720p30 mobile-friendly",
                "width": 1280,
                "height": 720,
                "fps": 30,
                "bitrate": 2000
            }
        ]
    }
}

# Backward compatibility - flatten for existing code
CHANNELS = []
for platform_id, platform_data in ENDPOINTS.items():
    for channel in platform_data["channels"]:
        CHANNELS.append({
            **channel,
            "platform": platform_data["name"],
            "platform_id": platform_id,
            "icon": platform_data["icon"]
        })

PRESETS_FLAT = []
for quality_id, quality_data in PRESETS.items():
    for variant in quality_data["variants"]:
        PRESETS_FLAT.append({
            **variant,
            "quality_category": quality_data["name"],
            "quality_id": quality_id
        })
