import React from 'react';
import './ControlStack.css';
import GlassCard from '../common/GlassCard';
import { Camera } from 'lucide-react';
import { mockInputs, mockEndpoints } from '../../mocks/mockData';

const ControlStack: React.FC = () => {
    const activeEndpoint = mockEndpoints[0];

    return (
        <div className="control-stack">
            {/* 1. INPUT GROUP CARD */}
            <GlassCard>
                <div className="control-section">
                    <div className="section-header">
                        <h3>INPUT SOURCES</h3>
                    </div>
                    <div className="input-grid">
                        {mockInputs.map(input => (
                            <div key={input.id} className={`control-item-card input-card ${input.active ? 'active' : ''}`}>
                                {input.active && <div className="active-dot">●</div>}
                                <div className="card-icon">
                                    <Camera size={14} />
                                </div>
                                <div className="card-content">
                                    <div className="card-name">{input.name}</div>
                                    <div className="card-meta">{input.type} — {input.format}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </GlassCard>

            {/* 2. PRESET GROUP CARD (YOUTUBE LIVE) */}
            <GlassCard>
                <div className="control-section">
                    <div className="section-header" style={{ borderColor: '#FF0000' }}>
                        <h3>YOUTUBE LIVE</h3>
                    </div>
                    <div className="preset-section">
                        <div className="preset-grid">
                            {activeEndpoint.presets.map(preset => (
                                <div key={preset.id} className={`control-item-card preset-card ${preset.active ? 'active' : ''}`}>
                                    {preset.active && <div className="active-dot">●</div>}
                                    <div className="card-content">
                                        <div className="card-name">{preset.name}</div>
                                        <div className="card-meta">
                                            {preset.bitrate} kbps — {preset.codec}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};

export default ControlStack;
