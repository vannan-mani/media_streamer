import React from 'react';
import NestedCard from '../common/NestedCard';
import GlassCard from '../common/GlassCard';
import { Globe, Radio, Youtube } from 'lucide-react';
import '../layout/ControlStack.css';
import type { PlatformGroup } from '../../hooks/useSentinel';

interface EndpointMasterCardProps {
    endpoints: Record<string, PlatformGroup>;
    selectedChannelId: string;
    onSelect: (channelId: string) => void;
}

const EndpointMasterCard: React.FC<EndpointMasterCardProps> = ({ endpoints, selectedChannelId, onSelect }) => {
    const platformKeys = Object.keys(endpoints);
    const totalChannels = platformKeys.reduce((sum, key) => sum + endpoints[key].channels.length, 0);

    const getPlatformIcon = (icon: string) => {
        switch (icon) {
            case 'youtube':
                return <Youtube size={18} />;
            case 'facebook':
                return <Globe size={18} />;
            default:
                return <Globe size={18} />;
        }
    };

    return (
        <GlassCard className="master-card">
            <NestedCard
                title="DESTINATION ENDPOINT"
                badge={`${platformKeys.length} PLATFORM${platformKeys.length !== 1 ? 'S' : ''} • ${totalChannels} CHANNEL${totalChannels !== 1 ? 'S' : ''}`}
                defaultExpanded={true}
            >
                <div className="platform-list">
                    {platformKeys.map((platformId) => {
                        const platform = endpoints[platformId];

                        return (
                            <NestedCard
                                key={platformId}
                                title={platform.name}
                                badge={`${platform.channels.length} CHANNEL${platform.channels.length !== 1 ? 'S' : ''}`}
                                isSubCard={true}
                                defaultExpanded={false}
                            >
                                <div className="channel-grid">
                                    {platform.channels.map((channel) => {
                                        const isSelected = selectedChannelId === channel.id;

                                        return (
                                            <div
                                                key={channel.id}
                                                className={`channel-card ${isSelected ? 'selected' : ''}`}
                                                onClick={() => onSelect(channel.id)}
                                            >
                                                <div className="channel-icon">
                                                    {getPlatformIcon(platform.icon)}
                                                </div>
                                                <div className="channel-info">
                                                    <span className="channel-name">{channel.name}</span>
                                                    <span className="channel-desc">{channel.description}</span>
                                                </div>
                                                <div className="channel-select">
                                                    <Radio size={14} className={isSelected ? 'radio-on' : 'radio-off'} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </NestedCard>
                        );
                    })}
                </div>
            </NestedCard>
        </GlassCard>
    );
};

export default EndpointMasterCard;
