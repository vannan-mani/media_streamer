import { useState, useEffect } from 'react';

interface DeckLinkInput {
    id: string;
    port: string;
    device_number: number;
    signal_detected: boolean;
    format: string | null;
    active: boolean;
}

interface DeckLinkDevice {
    id: string;
    device_number: number;
    name: string;
    inputs: DeckLinkInput[];
}

interface DeckLinkResponse {
    devices: DeckLinkDevice[];
    error?: string;
}

export const useDeckLinkDevices = () => {
    const [devices, setDevices] = useState<DeckLinkDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const response = await fetch('/api/decklink/devices');
                const data: DeckLinkResponse = await response.json();

                if (data.error) {
                    setError(data.error);
                    setDevices([]);
                } else {
                    setDevices(data.devices);
                    setError(null);
                }
            } catch (err) {
                console.error('Failed to fetch DeckLink devices:', err);
                setError('Failed to connect to backend');
                setDevices([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDevices();

        // Poll every 5 seconds for device status updates
        const interval = setInterval(fetchDevices, 5000);

        return () => clearInterval(interval);
    }, []);

    return { devices, loading, error };
};
