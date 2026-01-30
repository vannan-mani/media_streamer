import { useState, useEffect } from 'react';

type ExpansionZone = 'status' | 'input' | 'streaming' | 'context' | null;

export const useExpansion = () => {
    const [expandedZone, setExpandedZone] = useState<ExpansionZone>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && expandedZone) {
                setExpandedZone(null);
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [expandedZone]);

    const toggleZone = (zone: ExpansionZone) => {
        setExpandedZone((current) => (current === zone ? null : zone));
    };

    const isExpanded = (zone: ExpansionZone) => expandedZone === zone;

    return { expandedZone, toggleZone, isExpanded, setExpandedZone };
};
