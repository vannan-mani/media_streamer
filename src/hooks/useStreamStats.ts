import { useState, useEffect } from 'react';
import { type StreamStats, INITIAL_STREAM_STATS } from '../types';

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
    const currentStats = streamStats || (history.length > 0 ? history[history.length - 1] : INITIAL_STREAM_STATS);

    return { streamStats: currentStats, history };
};
