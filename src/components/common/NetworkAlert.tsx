import React from 'react';
import './NetworkAlert.css';
import { AlertTriangle, WifiOff } from 'lucide-react';

interface NetworkAlertProps {
    type: 'degraded' | 'critical' | 'offline';
    message: string;
    details?: string;
}

const NetworkAlert: React.FC<NetworkAlertProps> = ({ type, message, details }) => {
    const icons = {
        degraded: <AlertTriangle size={20} />,
        critical: <AlertTriangle size={20} />,
        offline: <WifiOff size={20} />,
    };

    const classNames = {
        degraded: 'network-alert-warning',
        critical: 'network-alert-critical',
        offline: 'network-alert-offline',
    };

    return (
        <div className={`network-alert ${classNames[type]}`}>
            <div className="network-alert-icon">{icons[type]}</div>
            <div className="network-alert-content">
                <div className="network-alert-message">{message}</div>
                {details && <div className="network-alert-details">{details}</div>}
            </div>
        </div>
    );
};

export default NetworkAlert;
