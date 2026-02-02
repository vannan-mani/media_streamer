import React, { useState } from 'react';
import NestedCard from '../common/NestedCard';
import type { PresetQuality } from '../../hooks/useSentinel';

interface EncodingMasterCardProps {
    presets: Record<string, PresetQuality>;
    selectedVariantId: string | null;
    onSelectVariant: (variantId: string) => void;
}

const EncodingMasterCard: React.FC<EncodingMasterCardProps> = ({
    presets,
    selectedVariantId,
    onSelectVariant
}) => {
    const [expandedMaster, setExpandedMaster] = useState(true);
    const [expandedQualities, setExpandedQualities] = useState<Record<string, boolean>>({});

    const qualityArray = Object.values(presets);
    const totalQualities = qualityArray.length;
    const totalVariants = qualityArray.reduce((sum, quality) => sum + quality.variants.length, 0);

    const toggleQuality = (qualityId: string) => {
        setExpandedQualities(prev => ({
            ...prev,
            [qualityId]: !prev[qualityId]
        }));
    };

    return (
        <NestedCard
            title="Encoding Preset"
            level={1}
            badge={`${totalQualities} Qualities • ${totalVariants} Variants`}
            isExpanded={expandedMaster}
            onToggle={() => setExpandedMaster(!expandedMaster)}
        >
            {qualityArray.map(quality => (
                <NestedCard
                    key={quality.id}
                    title={quality.name}
                    level={2}
                    badge={quality.resolution}
                    isExpanded={expandedQualities[quality.id] || false}
                    onToggle={() => toggleQuality(quality.id)}
                >
                    {quality.variants.map(variant => (
                        <NestedCard
                            key={variant.id}
                            title={variant.name}
                            level={3}
                            isSelected={selectedVariantId === variant.id}
                            isSelectable={true}
                            onSelect={() => onSelectVariant(variant.id)}
                            metadata={{
                                bitrate: variant.bitrate,
                                fps: variant.fps
                            }}
                        />
                    ))}
                </NestedCard>
            ))}
        </NestedCard>
    );
};

export default EncodingMasterCard;
