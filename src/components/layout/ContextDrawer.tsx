import React, { useState, useEffect } from 'react';
import './ContextDrawer.css';
import GlassCard from '../common/GlassCard';
import { TrendingUp, Shield, Activity } from 'lucide-react';
import { useStreamTelemetry } from '../../hooks/useStreamTelemetry';
import Sparkline from '../common/Sparkline';

const ContextDrawer: React.FC = () => {
    const { telemetry, isStreaming } = useStreamTelemetry();

    // History Buffers for Sparklines (max 30 points)
    const [bitrateHistory, setBitrateHistory] = useState<number[]>(new Array(30).fill(0));
    const [fpsHistory, setFpsHistory] = useState<number[]>(new Array(30).fill(0));

    useEffect(() => {
        if (telemetry) {
            setBitrateHistory(prev => [...prev.slice(1), telemetry.bitrate]);
            setFpsHistory(prev => [...prev.slice(1), telemetry.fps]);
        }
    }, [telemetry]);

    return (
        <GlassCard>
            <div className="context-drawer">
                <div className="context-drawer-header">
                    <span className="live-badge" style={{ backgroundColor: isStreaming ? '#FF0000' : '#444' }}>
                        {isStreaming ? 'LIVE UPLINK' : 'OFFLINE'}
                    </span>
                    <div className="youtube-ingest-badge">
                        <Shield size={8} />
                        <span>{telemetry?.network_health.toUpperCase() || 'UNKNOWN'}</span>
                    </div>
                    <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '10px' }}>
                        DURATION: {telemetry ? Math.floor(telemetry.stream_duration / 60) + 'M' : '00:00:00'}
                    </span>
                </div>

                <div className="context-drawer-content">
                    {/* 1. Network Metrics */}
                    <div className="context-section">
                        <h3><TrendingUp size={10} /> Transmission</h3>
                        <div className="network-metrics">
                            <div className="metric-item">
                                <div className="metric-label-value">
                                    <span className="metric-label">BITRATE</span>
                                    <span className="metric-value">{(telemetry?.bitrate || 0).toLocaleString()} <span style={{ fontSize: '8px' }}>kbps</span></span>
                                </div>
                                <div className="metric-sparkline">
                                    <Sparkline data={bitrateHistory} color="rgba(0, 122, 255, 1)" />
                                </div>
                            </div>
                            <div className="metric-item">
                                <div className="metric-label-value">
                                    <span className="metric-label">FPS</span>
                                    <span className="metric-value">{telemetry?.fps || 0}</span>
                                </div>
                                <div className="metric-sparkline">
                                    <Sparkline data={fpsHistory} color="rgba(52, 199, 89, 1)" />
                                </div>
                            </div>
                            <div className="metric-item no-graph">
                                <div className="metric-label-value">
                                    <span className="metric-label">DROPPED</span>
                                    <span className="metric-value" style={{ color: (telemetry?.dropped_frames || 0) > 0 ? '#FF3B30' : 'inherit' }}>
                                        {telemetry?.dropped_frames || 0}
                                    </span>
                                </div>
                                <div className="metric-status-text">
                                    FRAMES
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Encoding Health */}
                    <div className="context-section">
                        <h3><Activity size={10} /> Encoding Health</h3>
                        <div className="health-container">
                            <div className="health-grid">
                                <div className="health-item">
                                    <span className="health-label">LOAD (CPU)</span>
                                    <span className="health-value">{(telemetry?.encoding_load || 0).toFixed(1)}%</span>
                                </div>
                                <div className="health-item">
                                    <span className="health-label">PROCESSED</span>
                                    <span className="health-value">{(telemetry?.processed_frames || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
};

export default ContextDrawer;
