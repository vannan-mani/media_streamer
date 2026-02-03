/*
  STATUS STRIP - TSX 
  Fixed Data Mapping & Rounded Metrics
*/

import React from 'react';
import './StatusStrip.css';
import GlassCard from '../common/GlassCard';
import { useHealthData } from '../../hooks/useHealthData';
import Sparkline from '../common/Sparkline';

interface StatusStripProps {
    systemStatus?: string;
}

const StatusStrip: React.FC<StatusStripProps> = ({ systemStatus = 'Initializing...' }) => {
    const { healthData, history } = useHealthData();

    // Map health metrics to array with correct key names from HealthData interface
    const metrics = [
        {
            label: 'CPU',
            value: `${Math.round(healthData.cpu)}%`,
            data: history.map(h => h.cpu),
            color: '#007AFF',
            suffix: '%'
        },
        {
            label: 'GPU',
            value: `${Math.round(healthData.gpu)}%`,
            data: history.map(h => h.gpu),
            color: '#AF52DE',
            suffix: '%'
        },
        {
            label: 'TEMP',
            value: `${Math.round(healthData.temperature)}°C`,
            data: history.map(h => h.temperature),
            color: '#FF9500',
            suffix: '°'
        },
        {
            label: 'MEM',
            value: `${Math.round((healthData.memory.used / healthData.memory.total) * 100)}%`,
            data: history.map(h => (h.memory.used / h.memory.total) * 100),
            color: '#34C759',
            suffix: '%'
        }
    ];

    return (
        <GlassCard>
            <div className="status-strip">
                <div className="status-strip-main">
                    <div className="status-time">{new Date().toLocaleTimeString()}</div>
                    <div className="status-recording">
                        <span className={`status-pulse ${systemStatus === 'Streaming Live' ? 'active' : ''}`}></span>
                        {systemStatus === 'Streaming Live' ? 'LIVE' : 'READY'}
                    </div>
                    <div className="status-endpoint" style={{ textTransform: 'uppercase' }}>
                        {systemStatus}
                    </div>
                </div>

                <div className="status-strip-details">
                    {metrics.map((metric, i) => (
                        <div key={i} className="health-metric">
                            <div className="health-header">
                                <span className="health-label">{metric.label}</span>
                                <span className="health-value">{metric.value}</span>
                            </div>
                            <div className="health-sparkline-wrapper">
                                <Sparkline
                                    data={metric.data}
                                    color={metric.color}
                                    suffix={metric.suffix}
                                    showAxis={true}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </GlassCard>
    );
};

export default StatusStrip;
