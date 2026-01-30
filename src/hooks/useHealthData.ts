import { useState, useEffect, useRef } from 'react';
import { generateHealthData, type HealthData } from '../mocks/mockData';

interface UseHealthDataOptions {
    updateInterval?: number; // milliseconds
    enabled?: boolean;
}

export const useHealthData = (options: UseHealthDataOptions = {}) => {
    const { updateInterval = 2000, enabled = true } = options;
    const [healthData, setHealthData] = useState<HealthData>(generateHealthData());
    const [history, setHistory] = useState<HealthData[]>([]);
    const wsRef = useRef<WebSocket | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!enabled) return;

        // Start with mock data (WebSocket server not available)
        const startMockUpdates = () => {
            intervalRef.current = setInterval(() => {
                const newData = generateHealthData();
                setHealthData(newData);
                setHistory((prev) => [...prev.slice(-29), newData]);
            }, updateInterval);
        };

        // Use mock data by default
        startMockUpdates();

        // Cleanup function
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [enabled, updateInterval]);

    return { healthData, history };
};
