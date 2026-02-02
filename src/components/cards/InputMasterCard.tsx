import React, { useState } from 'react';
import NestedCard from '../common/NestedCard';
import type { InputDevice } from '../../hooks/useSentinel';

interface InputMasterCardProps {
    devices: Record<string, InputDevice>;
    selectedChannelId: string | null;
    onSelectChannel: (channelId: string) => void;
}

/**
 * Input Source Master Card
 * Progressive Disclosure: Shows compact tiles for each device
 * Each device tile shows channel count, signal status
 * Selection clicks the tile directly (no dropdown)
 */
const InputMasterCard: React.FC<InputMasterCardProps> = ({
    devices,
    selectedChannelId,
    onSelectChannel
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const deviceArray = Object.values(devices);

    // For single-channel devices, we show the device as the selectable item
    // For multi-channel devices, we need to expand to show channels
    const getDeviceSignalStatus = (device: InputDevice): 'present' | 'none' | 'waiting' => {
        const hasSignal = device.channels.some(ch => ch.signalStatus === 'present');
        const isWaiting = device.channels.some(ch => ch.signalStatus === 'waiting');
        if (hasSignal) return 'present';
        if (isWaiting) return 'waiting';
        return 'none';
    };

    const getDeviceBadge = (device: InputDevice): string => {
        if (device.channels.length === 1) {
            const ch = device.channels[0];
            if (ch.format) return ch.format;
            if (ch.signalStatus === 'waiting') return 'Waiting...';
            return ch.signalStatus === 'present' ? 'Active' : 'No Signal';
        }
        const active = device.channels.filter(ch => ch.signalStatus === 'present').length;
        return `${active}/${device.channels.length} active`;
    };

    // Check if any channel from this device is selected
    const isDeviceSelected = (device: InputDevice): boolean => {
        return device.channels.some(ch => ch.id === selectedChannelId);
    };

    // Handle device tile click - select first available channel
    const handleDeviceClick = (device: InputDevice) => {
        // For single-channel devices, select directly
        if (device.channels.length === 1 && device.channels[0].selectable) {
            onSelectChannel(device.channels[0].id);
        } else {
            // For multi-channel, select first available
            const firstSelectable = device.channels.find(ch => ch.selectable);
            if (firstSelectable) {
                onSelectChannel(firstSelectable.id);
            }
        }
    };

    const isDeviceSelectable = (device: InputDevice): boolean => {
        return device.channels.some(ch => ch.selectable);
    };

    return (
        <NestedCard
            title="Input Source"
            level={1}
            isExpanded={isExpanded}
            onToggle={() => setIsExpanded(!isExpanded)}
        >
            {deviceArray.map(device => (
                <NestedCard
                    key={device.id}
                    title={device.name}
                    level={3}
                    isSelected={isDeviceSelected(device)}
                    isSelectable={isDeviceSelectable(device)}
                    onSelect={() => handleDeviceClick(device)}
                    badge={getDeviceBadge(device)}
                    metadata={{
                        signal: getDeviceSignalStatus(device)
                    }}
                />
            ))}
        </NestedCard>
    );
};

export default InputMasterCard;
