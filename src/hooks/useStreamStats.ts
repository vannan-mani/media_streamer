import { useState, useEffect } from 'react';
import { generateStreamStats, type StreamStats } from '../mocks/mockData';

export const useStreamStats = (enabled: boolean = true) => {
    const [streamStats, setStreamStats] = useState<StreamStats>(generateStreamStats());
    const [history, setHistory] = useState<StreamStats[]>([]);

    useEffect(() => {
        if (!enabled) return;

        // Mock WebSocket updates
        const interval = setInterval(() => {
            const newStats = generateStreamStats();
            setStreamStats(newStats);
            setHistory((prev) => [...prev.slice(-29), newStats]);
        }, 2000);

        return () => clearInterval(interval);
    }, [enabled]);

    return { streamStats, history };
};
