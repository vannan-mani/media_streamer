import React from 'react';
import NestedCard from '../common/NestedCard';
import GlassCard from '../common/GlassCard';
import { Cpu, Radio } from 'lucide-react';
import '../layout/ControlStack.css';
import type { QualityGroup } from '../../hooks/useSentinel';

interface EncodingMasterCardProps {
    presets: Record<string, QualityGroup>;
    selectedPresetId: string;
    onSelect: (presetId: string) => void;
}

const EncodingMasterCard: React.FC<EncodingMasterCardProps> = ({ presets, selectedPresetId, onSelect }) => {
    const qualityKeys = Object.keys(presets);
    const totalVariants = qualityKeys.reduce((sum, key) => sum + presets[key].variants.length, 0);

    return (
        <GlassCard className="master-card">
            <NestedCard
                title="ENCODING PRESET"
                badge={`${qualityKeys.length} CATEGOR${qualityKeys.length !== 1 ? 'IES' : 'Y'} • ${totalVariants} VARIANT${totalVariants !== 1 ? 'S' : ''}`}
                defaultExpanded={true}
            >
                <div className="quality-list">
                    {qualityKeys.map((qualityId) => {
                        const quality = presets[qualityId];

                        return (
                            <NestedCard
                                key={qualityId}
                                title={quality.name}
                                badge={`${quality.variants.length} OPTION${quality.variants.length !== 1 ? 'S' : ''}`}
                                isSubCard={true}
                                defaultExpanded={false}
                            >
                                <div className="preset-grid">
                                    {quality.variants.map((variant) => {
                                        const isSelected = selectedPresetId === variant.id;

                                        return (
                                            <div
                                                key={variant.id}
                                                className={`preset-card ${isSelected ? 'selected' : ''}`}
                                                onClick={() => onSelect(variant.id)}
                                            >
                                                <div className="preset-icon">
                                                    <Cpu size={18} />
                                                </div>
                                                <div className="preset-info">
                                                    <span className="preset-name">{variant.name}</span>
                                                    <span className="preset-desc">
                                                        {variant.width}×{variant.height} @ {variant.fps}fps • {(variant.bitrate / 1000).toFixed(1)}Mbps
                                                    </span>
                                                </div>
                                                <div className="preset-select">
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

export default EncodingMasterCard;
