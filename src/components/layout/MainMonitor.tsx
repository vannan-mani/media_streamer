import React from 'react';
import './MainMonitor.css';
import GlassCard from '../common/GlassCard';

const MainMonitor: React.FC = () => {
    return (
        <GlassCard>
            <div className="main-monitor">
                <div className="video-preview">
                    <div className="video-placeholder">
                        NO VIDEO SIGNAL
                    </div>

                    {/* Audio Meters Overlay */}
                    <div className="audio-meters-overlay">
                        <div className="audio-channel">
                            <span className="audio-label">L</span>
                            <div className="audio-bar">
                                <div className="audio-level" style={{ width: '72%' }}></div>
                            </div>
                            <span className="audio-value">-12</span>
                        </div>
                        <div className="audio-channel">
                            <span className="audio-label">R</span>
                            <div className="audio-bar">
                                <div className="audio-level" style={{ width: '68%' }}></div>
                            </div>
                            <span className="audio-value">-14</span>
                        </div>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
};

export default MainMonitor;
