import React, { useState } from 'react';
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
        // Extract device ID from channel ID (format: "deviceId_chX")
        const deviceId = parseInt(channelId.split('_')[0]) || 0;
        // For now, use legacy setConfiguration - will need to update backend API later
        setConfiguration(deviceId, streamId, variantId);
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
            />
        </div>
    );
};

export default ControlStack;
