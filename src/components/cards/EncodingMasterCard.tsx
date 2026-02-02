import React, { useState } from 'react';
import NestedCard from '../common/NestedCard';
import type { PresetQuality } from '../../hooks/useSentinel';

interface EncodingMasterCardProps {
    presets: Record<string, PresetQuality>;
    selectedVariantId: string | null;
    onSelectVariant: (variantId: string) => void;
}

/**
 * Encoding Preset Master Card
 * Progressive Disclosure: Shows all variants as compact tiles
 * Each tile shows bitrate/fps badge
 * Grouped by quality (HD | SD) with visual separator
 */
const EncodingMasterCard: React.FC<EncodingMasterCardProps> = ({
    presets,
    selectedVariantId,
    onSelectVariant
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const qualityArray = Object.values(presets);

    return (
        <NestedCard
            title="Encoding Preset"
            level={1}
            isExpanded={isExpanded}
            onToggle={() => setIsExpanded(!isExpanded)}
        >
            {qualityArray.map((quality, qualityIndex) => (
                <React.Fragment key={quality.id || qualityIndex}>
                    {/* Quality divider (between HD/SD) */}
                    {qualityIndex > 0 && <div className="group-divider" />}

                    {/* All variants from this quality as tiles */}
                    {quality.variants.map(variant => (
                        <NestedCard
                            key={variant.id}
                            title={`${quality.name} ${variant.name}`}
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
                </React.Fragment>
            ))}
        </NestedCard>
    );
};

export default EncodingMasterCard;
