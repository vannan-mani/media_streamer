import React from 'react';
import { cn } from '../../lib/utils';
import '../../styles/globals.css'; // Ensure globals are loaded

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'interactive' | 'live' | 'success' | 'warning' | 'error' | 'metric';
    children: React.ReactNode;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ className, variant = 'default', children, ...props }, ref) => {

        // Base class from globals.css is .glass-card
        // We add variant-specific classes
        const variantClasses = {
            default: '',
            interactive: 'cursor-pointer hover:bg-white/10 active:scale-[0.98]', // using generic utility classes or matching CSS
            live: 'glass-card--live',
            success: 'glass-card--success',
            warning: 'glass-card--warning',
            error: 'glass-card--error',
            metric: 'glass-card--metric'
        };

        // Note: The specific CSS classes for variants (like .glass-card--live) 
        // need to be defined in globals.css or a module. 
        // I will assume they are global for now as per the design system doc.

        return (
            <div
                ref={ref}
                className={cn('glass-card', variantClasses[variant], className)}
                {...props}
            >
                {children}
            </div>
        );
    }
);

GlassCard.displayName = 'GlassCard';
