import React, { useState } from 'react';
import NestedCard from '../common/NestedCard';
import type { DestinationPlatform } from '../../hooks/useSentinel';

interface EndpointMasterCardProps {
    destinations: Record<string, DestinationPlatform>;
    selectedStreamId: string | null;
    onSelectStream: (streamId: string) => void;
}

const EndpointMasterCard: React.FC<EndpointMasterCardProps> = ({
    destinations,
    selectedStreamId,
    onSelectStream
}) => {
    const [expandedMaster, setExpandedMaster] = useState(true);
    const [expandedPlatforms, setExpandedPlatforms] = useState<Record<string, boolean>>({});

    const platformArray = Object.values(destinations);
    const totalPlatforms = platformArray.length;
    const totalStreams = platformArray.reduce((sum, platform) => sum + platform.streams.length, 0);

    const togglePlatform = (platformId: string) => {
        setExpandedPlatforms(prev => ({
            ...prev,
            [platformId]: !prev[platformId]
        }));
    };

    return (
        <NestedCard
            title="Destination"
            level={1}
            badge={`${totalPlatforms} Platforms • ${totalStreams} Streams`}
            isExpanded={expandedMaster}
            onToggle={() => setExpandedMaster(!expandedMaster)}
        >
            {platformArray.map(platform => (
                <NestedCard
                    key={platform.id}
                    title={platform.name}
                    level={2}
                    badge={`${platform.streams.length} streams`}
                    isExpanded={expandedPlatforms[platform.id] || false}
                    onToggle={() => togglePlatform(platform.id)}
                >
                    {platform.streams.map(stream => (
                        <NestedCard
                            key={stream.id}
                            title={stream.name}
                            level={3}
                            isSelected={selectedStreamId === stream.id}
                            isSelectable={true}
                            onSelect={() => onSelectStream(stream.id)}
                            metadata={{
                                description: stream.description
                            }}
                        />
                    ))}
                </NestedCard>
            ))}
        </NestedCard>
    );
};

export default EndpointMasterCard;
