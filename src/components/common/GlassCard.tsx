import React from 'react';
import './GlassCard.css';

interface GlassCardProps {
    children: React.ReactNode;
    active?: boolean;
    onClick?: () => void;
    className?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, active = false, onClick, className = '' }) => {
    return (
        <div
            className={`glass-card ${active ? 'glass-card-active' : ''} ${onClick ? 'clickable' : ''} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export default GlassCard;
