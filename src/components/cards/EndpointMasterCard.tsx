import React, { useState } from 'react';
import NestedCard from '../common/NestedCard';
import type { DestinationPlatform } from '../../hooks/useSentinel';

interface EndpointMasterCardProps {
    destinations: Record<string, DestinationPlatform>;
    selectedStreamId: string | null;
    onSelectStream: (streamId: string) => void;
}

/**
 * Destination Master Card
 * Progressive Disclosure: Shows all streams as compact tiles in a grid
 * Logical grouping: YT streams together, FB streams together (with visual separator)
 */
const EndpointMasterCard: React.FC<EndpointMasterCardProps> = ({
    destinations,
    selectedStreamId,
    onSelectStream
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const platformArray = Object.values(destinations);

    // Get platform icon prefix
    const getPlatformIcon = (platformId: string): string => {
        if (platformId.includes('youtube') || platformId === 'youtube') return '▶';
        if (platformId.includes('facebook') || platformId === 'facebook') return '📘';
        return '📺';
    };

    return (
        <NestedCard
            title="Destination"
            level={1}
            isExpanded={isExpanded}
            onToggle={() => setIsExpanded(!isExpanded)}
        >
            {platformArray.map((platform, platformIndex) => (
                <React.Fragment key={platform.id || platformIndex}>
                    {/* Platform divider (between platforms) */}
                    {platformIndex > 0 && <div className="group-divider" />}

                    {/* All streams from this platform as tiles */}
                    {platform.streams.map(stream => {
                        // Build destination ID in "platform:stream" format (e.g., "youtube:main")
                        const destinationId = `${platform.id}:${stream.id}`;

                        return (
                            <NestedCard
                                key={stream.id}
                                title={`${getPlatformIcon(platform.id || '')} ${stream.name}`}
                                level={3}
                                isSelected={selectedStreamId === destinationId}
                                isSelectable={true}
                                onSelect={() => onSelectStream(destinationId)}
                                metadata={{
                                    description: stream.description
                                }}
                            />
                        );
                    })}
                </React.Fragment>
            ))}
        </NestedCard>
    );
};

export default EndpointMasterCard;
