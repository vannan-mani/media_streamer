import { useState, useEffect } from 'react';

interface StreamTelemetry {
    bitrate: number;
    fps: number;
    dropped_frames: number;
    processed_frames: number;
    encoding_load: number;
    network_health: string;
    stream_duration: number;
    keyframe_interval: string;
}

export const useStreamTelemetry = (enabled: boolean = false) => {
    const [telemetry, setTelemetry] = useState<StreamTelemetry | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);

    useEffect(() => {
        // DISABLED: /api/stream/telemetry not implemented in SOA architecture yet
        if (!enabled) return;

        const fetchTelemetry = async () => {
            try {
                const response = await fetch('http://115.112.70.85:8000/api/stream/telemetry');
                const data: StreamTelemetry = await response.json();

                setTelemetry(data);

                // Consider streaming if we have processed frames
                setIsStreaming(data.processed_frames > 0);
            } catch (error) {
                console.error('Failed to fetch stream telemetry:', error);
                setTelemetry(null);
                setIsStreaming(false);
            }
        };

        fetchTelemetry();

        // Update every second for real-time stats
        const interval = setInterval(fetchTelemetry, 1000);

        return () => clearInterval(interval);
    }, [enabled]);

    return { telemetry, isStreaming };
};
