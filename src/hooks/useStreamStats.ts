import { useState, useEffect } from 'react';
import { type StreamStats } from '../mocks/mockData';

export const useStreamStats = (enabled: boolean = true) => {
    const [streamStats, setStreamStats] = useState<StreamStats | null>(null);
    const [history, setHistory] = useState<StreamStats[]>([]);

    useEffect(() => {
        if (!enabled) return;

        const fetchData = async () => {
            try {
                const response = await fetch('/api/stats');
                const data = await response.json();
                setStreamStats(data);
                setHistory((prev) => [...prev.slice(-29), data]);
            } catch (error) {
                console.error("Failed to fetch stream stats:", error);
            }
        };

        const interval = setInterval(fetchData, 2000);
        fetchData(); // Initial fetch

        return () => clearInterval(interval);
    }, [enabled]);

    // Fallback to empty/loading state if data hasn't arrived
    const currentStats = streamStats || (history.length > 0 ? history[history.length - 1] : {
        bitrate: 0,
        fps: 0,
        droppedFrames: 0,
        network: { upload: 0, rtt: 0, drops: 0, interfaceSpeed: 1000 },
        encoding: { keyframes: 'stable', gop: '2.0s', audioSync: 0, codecHealth: 'nominal' },
        youtubeIngest: 'good',
        timestamp: Date.now()
    } as StreamStats);

    return { streamStats: currentStats, history };
};
