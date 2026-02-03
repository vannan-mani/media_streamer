import React, { useState, useEffect } from 'react';
import './ControlStack.css';
import { useSentinel } from '../../hooks/useSentinel';

import InputMasterCard from '../cards/InputMasterCard';
import EndpointMasterCard from '../cards/EndpointMasterCard';
import EncodingMasterCard from '../cards/EncodingMasterCard';
import ActionFooter from '../cards/ActionFooter';

const ControlStack: React.FC = () => {
    // Get hierarchical data from hook
    const {
        state,
        inputDevices,
        destinations,
        encodingPresets,
        loading,
        setIntent,
        setConfiguration,
    } = useSentinel();

    // 3-Level selection state
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
    const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

    // Sync selection state with backend configuration on load
    useEffect(() => {
        if (state?.settings) {
            const { selected_input_id, selected_destination_id, selected_preset_id } = state.settings;
            if (selected_input_id) setSelectedChannelId(selected_input_id);
            if (selected_destination_id) setSelectedStreamId(selected_destination_id);
            if (selected_preset_id) setSelectedVariantId(selected_preset_id);
        }
    }, [state?.settings.selected_input_id, state?.settings.selected_destination_id, state?.settings.selected_preset_id]);

    const intent = state?.intent ?? 'DISABLED';
    const systemStatus = state?.system_status ?? 'Initializing...';

    // Check if all 3 selections are made
    const isConfigurationComplete = selectedChannelId !== null &&
        selectedStreamId !== null &&
        selectedVariantId !== null;

    // Handlers for 3-level selection
    const handleChannelSelect = (channelId: string) => {
        setSelectedChannelId(channelId);
        // TODO: Update backend configuration when all 3 are selected
        if (selectedStreamId && selectedVariantId) {
            updateBackendConfig(channelId, selectedStreamId, selectedVariantId);
        }
    };

    const handleStreamSelect = (streamId: string) => {
        setSelectedStreamId(streamId);
        if (selectedChannelId && selectedVariantId) {
            updateBackendConfig(selectedChannelId, streamId, selectedVariantId);
        }
    };

    const handleVariantSelect = (variantId: string) => {
        setSelectedVariantId(variantId);
        if (selectedChannelId && selectedStreamId) {
            updateBackendConfig(selectedChannelId, selectedStreamId, variantId);
        }
    };

    const updateBackendConfig = (channelId: string, streamId: string, variantId: string) => {
        // Extract device ID from channel ID (format: "decklink_0_input_0")
        // We need to parse the number after "decklink_" and before "_input"
        let deviceId = 0;
        const match = channelId.match(/decklink_(\d+)/);
        if (match && match[1]) {
            deviceId = parseInt(match[1], 10);
        }

        // Build destination_id in format "platform:stream"
        // streamId is now the platform_stream pair (e.g., "youtube:main")
        const destinationId = streamId;

        // inputId is the hardware input (e.g., "input_0")
        const inputId = channelId;

        // Call with new 3-tier structure: (deviceId, inputId, destinationId, presetId)
        setConfiguration(deviceId, inputId, destinationId, variantId);
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
                {/* 1. Input Source - 3-level: Master → Device → Channel */}
                <InputMasterCard
                    devices={inputDevices}
                    selectedChannelId={selectedChannelId}
                    onSelectChannel={handleChannelSelect}
                />

                {/* 2. Destination - 3-level: Master → Platform → Stream */}
                <EndpointMasterCard
                    destinations={destinations}
                    selectedStreamId={selectedStreamId}
                    onSelectStream={handleStreamSelect}
                />

                {/* 3. Encoding Preset - 3-level: Master → Quality → Variant */}
                <EncodingMasterCard
                    presets={encodingPresets}
                    selectedVariantId={selectedVariantId}
                    onSelectVariant={handleVariantSelect}
                />
            </div>

            {/* Action Footer */}
            <ActionFooter
                intent={intent}
                status={systemStatus}
                onToggle={handleToggle}
                canGoLive={isConfigurationComplete}
                hasSignal={Object.values(inputDevices).find(d => d.id.includes(selectedChannelId?.split('_')[0] || 'none'))?.channels.some(ch => ch.signalStatus === 'present')}
            />
        </div>
    );
};

export default ControlStack;
