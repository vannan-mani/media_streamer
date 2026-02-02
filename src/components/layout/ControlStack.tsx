import React, { useMemo } from 'react';
import './ControlStack.css';
import { useSentinel } from '../../hooks/useSentinel';

import InputMasterCard from '../cards/InputMasterCard';
import EndpointMasterCard from '../cards/EndpointMasterCard';
import EncodingMasterCard from '../cards/EncodingMasterCard';
import ActionFooter from '../cards/ActionFooter';

const ControlStack: React.FC = () => {
    // 1. Get State & Methods from Hook
    const {
        state,
        endpoints,
        presetsGrouped,
        loading,
        setIntent,
        setConfiguration,
        isConfigurationComplete
    } = useSentinel();

    // 2. Derive Current Selections
    const selectedDeviceId = state?.settings?.selected_device_id ?? 0;
    const selectedChannelId = state?.settings?.selected_channel_id ?? '';
    const selectedPresetId = state?.settings?.selected_preset_id ?? '';
    const intent = state?.intent ?? 'DISABLED';
    const systemStatus = state?.system_status ?? 'Initializing...';

    // 3. Hardware List (Flattened from Registry)
    const devices = useMemo(() => {
        if (!state?.hardware) return [];
        return Object.values(state.hardware).map((h: any) => ({
            ...h.info,
            status: h.status
        })).sort((a, b) => a.device_number - b.device_number);
    }, [state?.hardware]);

    // 4. Handlers
    const handleInputSelect = (id: number) => {
        setConfiguration(id, selectedChannelId, selectedPresetId);
    };

    const handleChannelSelect = (id: string) => {
        setConfiguration(selectedDeviceId, id, selectedPresetId);
    };

    const handlePresetSelect = (id: string) => {
        setConfiguration(selectedDeviceId, selectedChannelId, id);
    };

    const handleToggle = () => {
        const newIntent = intent === 'AUTO_STREAM' ? 'DISABLED' : 'AUTO_STREAM';
        setIntent(newIntent);
    };

    if (loading && !state) {
        return <div className="loading-container">CONNECTING TO SENTINEL...</div>;
    }

    return (
        <div className="control-stack">
            <div className="card-stack-scroll">
                {/* 1. Input Source */}
                <InputMasterCard
                    devices={devices}
                    selectedDeviceId={selectedDeviceId}
                    onSelect={handleInputSelect}
                />

                {/* 2. Destination Endpoint */}
                <EndpointMasterCard
                    endpoints={endpoints}
                    selectedChannelId={selectedChannelId}
                    onSelect={handleChannelSelect}
                />

                {/* 3. Encoding Preset */}
                <EncodingMasterCard
                    presets={presetsGrouped}
                    selectedPresetId={selectedPresetId}
                    onSelect={handlePresetSelect}
                />
            </div>

            {/* 4. Action Footer (Fixed Bottom) - Only enable if all selections are made */}
            <ActionFooter
                intent={intent}
                status={systemStatus}
                onToggle={handleToggle}
                canGoLive={isConfigurationComplete}
            />
        </div>
    );
};

export default ControlStack;
