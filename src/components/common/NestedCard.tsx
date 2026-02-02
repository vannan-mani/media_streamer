import React from 'react';
import './NestedCard.css';

interface NestedCardProps {
    title: string;
    level: 1 | 2 | 3;
    badge?: string;
    metadata?: {
        signal?: 'present' | 'none' | 'waiting';
        format?: string;
        bitrate?: number;
        fps?: number;
        description?: string;
    };
    children?: React.ReactNode;

    // Expansion (for Level 1 only)
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
    isExpanded = true, // Default to expanded for Level 1
    onToggle,
    isSelected = false,
    isSelectable = true,
    onSelect,
    className = ''
}) => {
    const isLeafCard = level === 3;
    const isWaiting = metadata?.signal === 'waiting';
    const isDisabled = !isSelectable || isWaiting;

    const handleClick = () => {
        if (isLeafCard && !isDisabled && onSelect) {
            onSelect();
        } else if (level === 1 && onToggle) {
            onToggle();
        }
    };

    // Build CSS classes
    const cardClasses = [
        'nested-card',
        `level-${level}`,
        isSelected ? 'selected' : '',
        isDisabled && isLeafCard ? 'disabled' : '',
        isWaiting ? 'waiting' : '',
        className
    ].filter(Boolean).join(' ');

    // Render signal indicator for Level 3 tiles
    const renderSignal = () => {
        if (!metadata?.signal) return null;
        return <span className={`signal-dot ${metadata.signal}`} />;
    };

    return (
        <div className={cardClasses}>
            <div
                className="nested-card-header"
                onClick={handleClick}
                style={{ cursor: isLeafCard && !isDisabled ? 'pointer' : level === 1 ? 'pointer' : 'default' }}
            >
                {/* Level 1: Section header */}
                {level === 1 && (
                    <h3 className="card-title">{title}</h3>
                )}

                {/* Level 3: Compact tile content */}
                {level === 3 && (
                    <>
                        <div className="tile-content">
                            {renderSignal()}
                            <span className="card-title">{title}</span>
                        </div>
                        {badge && <span className="tile-badge">{badge}</span>}
                        {metadata?.format && <span className="tile-badge">{metadata.format}</span>}
                        {metadata?.bitrate && <span className="tile-badge">{metadata.bitrate >= 1000 ? `${(metadata.bitrate / 1000).toFixed(1)}M` : `${metadata.bitrate}k`}</span>}
                        {isWaiting && <span className="tile-badge">Waiting...</span>}
                    </>
                )}
            </div>

            {/* Children container for Level 1 (always visible when expanded) */}
            {level === 1 && children && isExpanded && (
                <div className="nested-card-body">
                    {children}
                </div>
            )}

            {/* Level 2 passes through children directly */}
            {level === 2 && children}
        </div>
    );
};

export default NestedCard;
