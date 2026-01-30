import React from 'react';
import './DashboardLayout.css';
import StatusStrip from './StatusStrip';
import MainMonitor from './MainMonitor';
import ControlStack from './ControlStack';
import ContextDrawer from './ContextDrawer';

// Card-based layout with proper sizing
const DashboardLayout: React.FC = () => {
    return (
        <div className="dashboard-layout">
            <StatusStrip />
            <div className="dashboard-content">
                <div className="main-area">
                    <MainMonitor />
                </div>
                <div className="control-area">
                    <ControlStack />
                </div>
            </div>
            <ContextDrawer />
        </div>
    );
};

export default DashboardLayout;
