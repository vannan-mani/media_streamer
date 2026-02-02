import React from 'react';
import { Activity, Power } from 'lucide-react';
import '../layout/ControlStack.css';

interface ActionFooterProps {
    intent: 'AUTO_STREAM' | 'DISABLED';
    status: string;
    onToggle: () => void;
    canGoLive: boolean; // Computed from selections
}

const ActionFooter: React.FC<ActionFooterProps> = ({ intent, status, onToggle, canGoLive }) => {
    const isLive = intent === 'AUTO_STREAM';

    return (
        <div className={`action-footer ${isLive ? 'intent-live' : 'intent-standby'}`}>
            <div className="status-readout">
                <Activity size={18} className={isLive ? 'pulse-icon' : ''} />
                <span className="system-status-text">{status.toUpperCase()}</span>
            </div>

            <button
                className={`master-toggle ${isLive ? 'active' : ''}`}
                onClick={onToggle}
                disabled={!canGoLive}
            >
                <Power size={24} />
                <span className="toggle-label">
                    {isLive ? 'END TRANSMISSION' : 'GO LIVE'}
                </span>
            </button>
        </div>
    );
};

export default ActionFooter;
