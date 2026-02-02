import { useState, useEffect, useRef } from 'react';
import { type HealthData } from '../mocks/mockData';

interface UseHealthDataOptions {
    updateInterval?: number; // milliseconds
    enabled?: boolean;
}

export const useHealthData = (options: UseHealthDataOptions = {}) => {
    const { updateInterval = 2000, enabled = true } = options;
    const [healthData, setHealthData] = useState<HealthData | null>(null);
    const [history, setHistory] = useState<HealthData[]>([]);
    const intervalRef = useRef<any>(null);

    useEffect(() => {
        if (!enabled) return;

        const fetchData = async () => {
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                setHealthData(data);
                setHistory((prev) => [...prev.slice(-29), data]);
            } catch (error) {
                console.error("Failed to fetch health data:", error);
            }
        };

        intervalRef.current = setInterval(fetchData, updateInterval);
        fetchData(); // Initial fetch

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [enabled, updateInterval]);

    // Fallback logic to prevent breaking UI if data is null
    const currentHealth = healthData || (history.length > 0 ? history[history.length - 1] : {
        cpu: 0, gpu: 0, temperature: 0, memory: { used: 0, total: 16 }, timestamp: Date.now()
    } as HealthData);

    return { healthData: currentHealth, history };
};
