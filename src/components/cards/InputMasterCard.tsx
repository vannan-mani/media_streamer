import React, { useState } from 'react';
import NestedCard from '../common/NestedCard';
import type { InputDevice } from '../../hooks/useSentinel';

interface InputMasterCardProps {
    devices: Record<string, InputDevice>;
    selectedChannelId: string | null;
    onSelectChannel: (channelId: string) => void;
}

const InputMasterCard: React.FC<InputMasterCardProps> = ({
    devices,
    selectedChannelId,
    onSelectChannel
}) => {
    const [expandedMaster, setExpandedMaster] = useState(true);
    const [expandedDevices, setExpandedDevices] = useState<Record<string, boolean>>({});

    const deviceArray = Object.values(devices);
    const totalDevices = deviceArray.length;
    const totalChannels = deviceArray.reduce((sum, dev) => sum + dev.channels.length, 0);
    const activeChannels = deviceArray.reduce((sum, dev) =>
        sum + dev.channels.filter(ch => ch.signalStatus === 'present').length, 0
    );

    const toggleDevice = (deviceId: string) => {
        setExpandedDevices(prev => ({
            ...prev,
            [deviceId]: !prev[deviceId]
        }));
    };

    return (
        <NestedCard
            title="Input Source"
            level={1}
            badge={`${totalDevices} Devices • ${activeChannels}/${totalChannels} Active`}
            isExpanded={expandedMaster}
            onToggle={() => setExpandedMaster(!expandedMaster)}
        >
            {deviceArray.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
                    No input devices detected
                </div>
            ) : (
                <>
                    {deviceArray.map(device => {
                        const activeSignals = device.channels.filter(ch => ch.signalStatus === 'present').length;

                        return (
                            <NestedCard
                                key={device.id}
                                title={device.name}
                                level={2}
                                badge={`${activeSignals}/${device.channels.length}`}
                                isExpanded={expandedDevices[device.id] || false}
                                onToggle={() => toggleDevice(device.id)}
                            >
                                {device.channels.map(channel => (
                                    <NestedCard
                                        key={channel.id}
                                        title={`Channel ${channel.channelNumber}`}
                                        level={3}
                                        isSelected={selectedChannelId === channel.id}
                                        isSelectable={channel.selectable}
                                        onSelect={() => onSelectChannel(channel.id)}
                                        metadata={{
                                            signal: channel.signalStatus,
                                            format: channel.format
                                        }}
                                    />
                                ))}
                            </NestedCard>
                        );
                    })}
                </>
            )}
        </NestedCard>
    );
};

export default InputMasterCard;
