import React from 'react';
import './ContextDrawer.css';
import GlassCard from '../common/GlassCard';
import { TrendingUp, ArrowRight, Users, MessageSquare } from 'lucide-react';
import { useStreamStats } from '../../hooks/useStreamStats';
import { generateAIInsights } from '../../mocks/mockData';
import Sparkline from '../common/Sparkline';

const ContextDrawer: React.FC = () => {
    const { streamStats, history } = useStreamStats();
    const aiInsights = generateAIInsights();

    return (
        <GlassCard>
            <div className="context-drawer">
                <div className="context-drawer-header">
                    <span className="live-badge">YouTube Live</span>
                    <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '10px' }}>UPTIME: 02:34:18</span>
                </div>

                <div className="context-drawer-content">
                    {/* 1. Network - Removed Drop Sparkline */}
                    <div className="context-section">
                        <h3><TrendingUp size={10} /> Network</h3>
                        <div className="network-metrics">
                            <div className="metric-item">
                                <div className="metric-label-value">
                                    <span className="metric-label">UP</span>
                                    <span className="metric-value">{streamStats.network.upload.toFixed(1)}</span>
                                </div>
                                <div className="metric-sparkline">
                                    <Sparkline
                                        data={history.map(h => h.network.upload)}
                                        color="rgba(0, 122, 255, 1)"
                                    />
                                </div>
                            </div>
                            <div className="metric-item">
                                <div className="metric-label-value">
                                    <span className="metric-label">RTT</span>
                                    <span className="metric-value">{streamStats.network.rtt.toFixed(0)}ms</span>
                                </div>
                                <div className="metric-sparkline">
                                    <Sparkline
                                        data={history.map(h => h.network.rtt)}
                                        color="rgba(52, 199, 89, 1)"
                                    />
                                </div>
                            </div>
                            <div className="metric-item no-graph">
                                <div className="metric-label-value">
                                    <span className="metric-label">DROP</span>
                                    <span className="metric-value" style={{ color: streamStats.network.drops > 0.1 ? '#FF3B30' : 'inherit' }}>
                                        {streamStats.network.drops.toFixed(3)}%
                                    </span>
                                </div>
                                <div className="metric-status-text">
                                    {streamStats.network.drops < 0.05 ? 'STABLE' : 'JITTER'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Audience - Logic refined for alignment */}
                    <div className="context-section">
                        <h3><Users size={10} /> Audience</h3>
                        <div className="audience-container">
                            <div className="audience-stats-top">
                                <div className="stat-card-mini">
                                    <span className="stat-label">PEAK</span>
                                    <span className="stat-value">{aiInsights.viewership.peak.toLocaleString()}</span>
                                </div>
                                <div className="stat-card-mini">
                                    <span className="stat-label">LIVE</span>
                                    <span className="stat-value">{aiInsights.viewership.current.toLocaleString()}</span>
                                </div>
                                <div className="stat-card-mini">
                                    <span className="stat-label">AVG</span>
                                    <span className="stat-value">{aiInsights.viewership.average.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="regions-container">
                                {aiInsights.viewership.regions.slice(0, 3).map(region => (
                                    <div key={region.country} className="region-item">
                                        <span className="region-name">{region.country}</span>
                                        <div className="region-bar-bg">
                                            <div
                                                className="region-bar-fill"
                                                style={{ width: `${region.percentage}%` }}
                                            />
                                        </div>
                                        <span className="region-pct">{region.percentage}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 3. Chat */}
                    <div className="context-section">
                        <h3><MessageSquare size={10} /> Insights</h3>
                        <div className="chat-container">
                            <div className="topic-tags">
                                {aiInsights.chat.topics.slice(0, 4).map((topic, i) => (
                                    <span key={i} className="topic-tag">{topic}</span>
                                ))}
                            </div>
                            <div className="technical-summary">
                                <span>SENTIMENT: {aiInsights.chat.sentiment.toUpperCase()}</span>
                                <span>BUFFER: 0.1%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
};

export default ContextDrawer;
