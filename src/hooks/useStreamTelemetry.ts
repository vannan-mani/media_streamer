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

export const useStreamTelemetry = (enabled: boolean = true) => {
    const [telemetry, setTelemetry] = useState<StreamTelemetry | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);

    useEffect(() => {
        if (!enabled) return;

        const fetchTelemetry = async () => {
            try {
                const response = await fetch('/api/stream/telemetry');
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
