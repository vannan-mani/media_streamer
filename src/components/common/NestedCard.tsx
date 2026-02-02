import React from 'react';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import './NestedCard.css';

interface NestedCardProps {
    title: string;
    level: 1 | 2 | 3; // Master, Group, or Item
    badge?: string;
    metadata?: Record<string, any>; // For displaying extra info (signal, bitrate, etc.)
    children?: React.ReactNode;

    // Expansion (for Level 1 & 2)
    isExpanded?: boolean;
    onToggle?: () => void;

    // Selection (for Level 3 only)
    isSelected?: boolean;
    isSelectable?: boolean;
    onSelect?: () => void;

    className?: string;
}

const NestedCard: React.FC<NestedCardProps> = ({
    title,
    level,
    badge,
    metadata,
    children,
    isExpanded = false,
    onToggle,
    isSelected = false,
    isSelectable = false,
    onSelect,
    className = ''
}) => {
    const isLeafCard = level === 3;
    const hasChildren = Boolean(children);

    const handleClick = () => {
        if (isLeafCard && isSelectable && onSelect) {
            onSelect();
        } else if (hasChildren && onToggle) {
            onToggle();
        }
    };

    const renderMetadata = () => {
        if (!metadata) return null;

        return (
            <div className="card-metadata">
                {metadata.signal && (
                    <span className={`signal-badge ${metadata.signal}`}>
                        {metadata.signal === 'present' ? '●' : '○'}
                    </span>
                )}
                {metadata.format && (
                    <span className="format-text">{metadata.format}</span>
                )}
                {metadata.bitrate && (
                    <span className="bitrate-text">{metadata.bitrate} kbps</span>
                )}
                {metadata.fps && (
                    <span className="fps-text">{metadata.fps}fps</span>
                )}
            </div>
        );
    };

    return (
        <div
            className={`nested-card level-${level} ${isSelected ? 'selected' : ''} ${!isSelectable && isLeafCard ? 'disabled' : ''} ${className}`}
        >
            <div
                className="nested-card-header"
                onClick={handleClick}
                style={{ cursor: (isLeafCard && isSelectable) || hasChildren ? 'pointer' : 'default' }}
            >
                <div className="header-left">
                    {/* Chevron for expandable cards (Level 1 & 2) */}
                    {hasChildren && !isLeafCard && (
                        isExpanded ? <ChevronDown size={level === 1 ? 20 : 16} /> : <ChevronRight size={level === 1 ? 20 : 16} />
                    )}

                    {/* Checkmark for selected Level 3 cards */}
                    {isLeafCard && isSelected && <Check size={16} className="check-icon" />}

                    <h3 className={`card-title level-${level}-title`}>{title}</h3>
                </div>

                <div className="header-right">
                    {badge && <span className="nested-badge">{badge}</span>}
                    {renderMetadata()}
                </div>
            </div>

            {/* Children for Level 1 & 2 cards */}
            {hasChildren && isExpanded && (
                <div className="nested-card-body">
                    {children}
                </div>
            )}
        </div>
    );
};

export default NestedCard;
