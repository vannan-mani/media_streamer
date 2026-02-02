import { useState, useEffect, useCallback, useMemo } from 'react';

// Types matching the Sentinel State
export interface Channel {
    id: string;
    name: string;
    icon?: string;
    description: string;
    url: string;
    platform?: string;
    platform_id?: string;
}

export interface Preset {
    id: string;
    name: string;
    width: number;
    height: number;
    fps: number;
    bitrate: number;
    description: string;
    quality_category?: string;
    quality_id?: string;
}

export interface PlatformGroup {
    name: string;
    icon: string;
    channels: Channel[];
}

export interface QualityGroup {
    name: string;
    description: string;
    variants: Preset[];
}

// 3-Level Hierarchical Types
export interface InputChannel {
    id: string;
    channelNumber: number;
    signalStatus: 'present' | 'none' | 'waiting';
    format: string | null;
    selectable: boolean;
}

export interface InputDevice {
    id: string;
    name: string;
    channels: InputChannel[];
}

export interface DestinationStream {
    id: string;
    name: string;
    key: string;
    description?: string;
}

export interface DestinationPlatform {
    id: string;
    name: string;
    icon?: string;
    streams: DestinationStream[];
}

export interface PresetVariant {
    id: string;
    name: string;
    bitrate: number;
    fps: number;
    description?: string;
}

export interface PresetQuality {
    id: string;
    name: string;
    resolution?: string;
    variants: PresetVariant[];
}

export interface SentinelState {
    intent: 'AUTO_STREAM' | 'DISABLED';
    system_status: string;
    hardware: Record<string, any>; // Hardware Registry
    settings: { // Configuration Selections
        selected_device_id: number;
        selected_channel_id: string;
        selected_preset_id: string;
    };
}

export const useSentinel = () => {
    const [state, setState] = useState<SentinelState | null>(null);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [presets, setPresets] = useState<Preset[]>([]);

    // Hierarchical data (2-level - legacy)
    const [endpoints, setEndpoints] = useState<Record<string, PlatformGroup>>({});
    const [presetsGrouped, setPresetsGrouped] = useState<Record<string, QualityGroup>>({});

    // 3-Level Hierarchical data
    const [inputDevices, setInputDevices] = useState<Record<string, InputDevice>>({});
    const [destinations, setDestinations] = useState<Record<string, DestinationPlatform>>({});
    const [encodingPresets, setEncodingPresets] = useState<Record<string, PresetQuality>>({});

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch hierarchical options
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                // Fetch flat data for backward compatibility
                const flatRes = await fetch('/api/sentinel/options');
                if (flatRes.ok) {
                    const data = await flatRes.json();
                    setChannels(data.channels);
                    setPresets(data.presets);
                }

                // Fetch nested/hierarchical data (2-level - legacy)
                const nestedRes = await fetch('/api/sentinel/options/nested');
                if (nestedRes.ok) {
                    const nestedData = await nestedRes.json();
                    setEndpoints(nestedData.endpoints);
                    setPresetsGrouped(nestedData.presets);
                }

                // Fetch 3-level hierarchical data
                const hierarchicalRes = await fetch('/api/sentinel/options/hierarchical');
                if (hierarchicalRes.ok) {
                    const hierarchicalData = await hierarchicalRes.json();
                    setInputDevices(hierarchicalData.inputs || {});
                    setDestinations(hierarchicalData.destinations || {});
                    setEncodingPresets(hierarchicalData.presets || {});
                }
            } catch (e) {
                console.error("Failed to fetch Sentinel options:", e);
            }
        };
        fetchOptions();
    }, []);

    // Poll State every 1s
    useEffect(() => {
        const fetchState = async () => {
            try {
                const res = await fetch('/api/sentinel/state');
                if (!res.ok) throw new Error('API Error');
                const data = await res.json();
                setState(data);
                setError(null);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchState();
        const interval = setInterval(fetchState, 1000);
        return () => clearInterval(interval);
    }, []);

    // Set Intent Action
    const setIntent = useCallback(async (action: 'AUTO_STREAM' | 'DISABLED') => {
        try {
            await fetch('/api/sentinel/intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            // Optimistic update
            setState(prev => prev ? { ...prev, intent: action } : null);
        } catch (err) {
            console.error(err);
        }
    }, []);

    // Set Configuration
    const setConfiguration = useCallback(async (deviceId: number, channelId: string, presetId: string) => {
        try {
            await fetch('/api/sentinel/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selected_device_id: deviceId,
                    selected_channel_id: channelId,
                    selected_preset_id: presetId
                }),
            });
            // Optimistic update
            setState(prev => prev ? {
                ...prev,
                settings: {
                    selected_device_id: deviceId,
                    selected_channel_id: channelId,
                    selected_preset_id: presetId
                }
            } : null);
        } catch (err) {
            console.error(err);
        }
    }, []);

    // Helper: Check if configuration is complete
    const isConfigurationComplete = useMemo(() => {
        if (!state) return false;
        const { selected_device_id, selected_channel_id, selected_preset_id } = state.settings;
        return (
            selected_device_id !== null &&
            selected_device_id !== undefined &&
            selected_channel_id !== '' &&
            selected_preset_id !== ''
        );
    }, [state]);

    return {
        state,
        channels,
        presets,
        endpoints,
        presetsGrouped,
        // 3-level hierarchical data
        inputDevices,
        destinations,
        encodingPresets,
        loading,
        error,
        setIntent,
        setConfiguration,
        isConfigurationComplete
    };
};

