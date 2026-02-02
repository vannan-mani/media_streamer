import { Activity, Power, AlertTriangle, CheckCircle2 } from 'lucide-react';
import './ActionFooter.css';

interface ActionFooterProps {
    intent: 'AUTO_STREAM' | 'DISABLED';
    status: string;
    onToggle: () => void;
    canGoLive: boolean; // Computed from selections
    hasSignal?: boolean; // New prop to show signal warning
}

const ActionFooter: React.FC<ActionFooterProps> = ({
    intent,
    status,
    onToggle,
    canGoLive,
    hasSignal = true
}) => {
    const isLive = intent === 'AUTO_STREAM';
    const showSignalWarning = !isLive && !hasSignal && canGoLive;

    return (
        <div className={`action-footer-container ${isLive ? 'intent-live' : 'intent-standby'}`}>
            <div className={`action-footer-card ${showSignalWarning ? 'has-warning' : ''} ${canGoLive && !isLive ? 'is-ready' : ''}`}>

                {/* Status Section */}
                <div className="action-status-section">
                    <div className="status-indicator">
                        {isLive ? (
                            <Activity size={20} className="pulse-icon live" />
                        ) : showSignalWarning ? (
                            <AlertTriangle size={20} className="warning-icon" />
                        ) : canGoLive ? (
                            <CheckCircle2 size={20} className="ready-icon" />
                        ) : (
                            <Activity size={20} className="standby-icon" />
                        )}
                        <div className="status-info">
                            <span className="status-label">{isLive ? 'STREAMING' : 'SYSTEM STATUS'}</span>
                            <span className="status-value">{status.toUpperCase()}</span>
                        </div>
                    </div>
                </div>

                {/* Main Action Button */}
                <button
                    className={`go-live-button ${isLive ? 'stop' : 'start'}`}
                    onClick={onToggle}
                    disabled={!canGoLive}
                >
                    <div className="button-content">
                        <Power size={24} />
                        <span className="button-text">
                            {isLive ? 'STOP STREAM' : 'GO LIVE'}
                        </span>
                    </div>
                    {!isLive && canGoLive && <div className="button-glow" />}
                </button>

                {/* Signal Warning Overlay (Optional hint) */}
                {showSignalWarning && (
                    <div className="action-footer-hint">
                        <AlertTriangle size={14} />
                        <span>Warning: No signal detected on physical input</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActionFooter;
