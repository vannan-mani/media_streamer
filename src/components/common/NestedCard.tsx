import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import './NestedCard.css';

interface NestedCardProps {
    title: string;
    badge?: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    isSubCard?: boolean;
    className?: string;
}

const NestedCard: React.FC<NestedCardProps> = ({
    title,
    badge,
    children,
    defaultExpanded = false,
    isSubCard = false,
    className = ''
}) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

    return (
        <div className={`nested-card ${isSubCard ? 'sub-card' : 'master-card'} ${className}`}>
            <div
                className="nested-card-header"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="header-left">
                    {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <h3>{title}</h3>
                </div>
                {badge && <span className="nested-badge">{badge}</span>}
            </div>

            {expanded && (
                <div className="nested-card-body">
                    {children}
                </div>
            )}
        </div>
    );
};

export default NestedCard;
