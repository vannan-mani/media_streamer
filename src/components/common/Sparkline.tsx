import React from 'react';

interface SparklineProps {
    data: number[];
    width?: number;
    height?: number;
    color?: string;
    showThreshold?: boolean;
    thresholdValue?: number;
    showGrid?: boolean;
}

const Sparkline: React.FC<SparklineProps> = ({
    data,
    width = 0,
    height = 0,
    color = 'rgba(0, 122, 255, 1)',
    showThreshold = false,
    thresholdValue = 75,
    showGrid = true,
}) => {
    const svgRef = React.useRef<SVGSVGElement>(null);
    const [dimensions, setDimensions] = React.useState({ width: 100, height: 40 });
    const resizeTimeoutRef = React.useRef<number | null>(null);
    const gradientId = `sparkline-gradient-${React.useId()}`;

    React.useEffect(() => {
        if (width !== 0 && height !== 0) {
            setDimensions({ width, height });
            return;
        }

        const svg = svgRef.current;
        if (!svg || !svg.parentElement) return;

        const updateDimensions = (entries: ResizeObserverEntry[]) => {
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }

            resizeTimeoutRef.current = setTimeout(() => {
                const entry = entries[0];
                if (entry) {
                    const { width: newWidth, height: newHeight } = entry.contentRect;
                    setDimensions(prev => {
                        const widthDiff = Math.abs(prev.width - newWidth);
                        const heightDiff = Math.abs(prev.height - newHeight);
                        if (widthDiff > 2 || heightDiff > 2) {
                            return {
                                width: width === 0 ? Math.floor(newWidth) : width,
                                height: height === 0 ? Math.floor(newHeight) : height,
                            };
                        }
                        return prev;
                    });
                }
            }, 100);
        };

        const resizeObserver = new ResizeObserver(updateDimensions);
        resizeObserver.observe(svg.parentElement);

        const parent = svg.parentElement;
        if (parent) {
            setDimensions({
                width: width === 0 ? Math.floor(parent.clientWidth) : width,
                height: height === 0 ? Math.floor(parent.clientHeight) : height,
            });
        }

        return () => {
            if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
            resizeObserver.disconnect();
        };
    }, [width, height]);

    const actualWidth = width === 0 ? dimensions.width : width;
    const actualHeight = height === 0 ? dimensions.height : height;

    if (!data || data.length === 0 || actualWidth <= 0 || actualHeight <= 0) return null;
    if (data.length < 2) return null;

    const padding = 6;
    const innerWidth = actualWidth - padding * 2;
    const innerHeight = actualHeight - padding * 2;

    if (innerWidth <= 0 || innerHeight <= 0) return null;

    const validData = data.filter(v => typeof v === 'number' && !isNaN(v));
    if (validData.length < 2) return null;

    const minValue = Math.min(...validData);
    const maxValue = Math.max(...validData);
    const range = maxValue - minValue;
    const effectiveRange = range === 0 ? 1 : range;

    const points = validData.map((value, index) => {
        const x = padding + (index / Math.max(1, validData.length - 1)) * innerWidth;
        const normalizedValue = (value - minValue) / effectiveRange;
        const y = padding + innerHeight - (normalizedValue * innerHeight);
        return { x, y };
    });

    // --- BEZIER SMOOTHING ALGORITHM ---
    const getCurvePath = (pts: { x: number, y: number }[]) => {
        if (pts.length < 2) return "";
        let path = `M ${pts[0].x},${pts[0].y}`;

        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[Math.max(i - 1, 0)];
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const p3 = pts[Math.min(i + 2, pts.length - 1)];

            // Cubic Bezier control points calculation
            const c1x = p1.x + (p2.x - p0.x) / 6;
            const c1y = p1.y + (p2.y - p0.y) / 6;
            const c2x = p2.x - (p3.x - p1.x) / 6;
            const c2y = p2.y - (p3.y - p1.y) / 6;

            path += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
        }
        return path;
    };

    const pathData = getCurvePath(points);
    const areaData = `${pathData} L ${points[points.length - 1].x},${actualHeight} L ${points[0].x},${actualHeight} Z`;

    return (
        <svg ref={svgRef} width={actualWidth} height={actualHeight} style={{ display: 'block', overflow: 'visible' }}>
            <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.05" />
                </linearGradient>
            </defs>

            {showGrid && (
                <g opacity="0.1">
                    <line x1={0} y1={actualHeight / 2} x2={actualWidth} y2={actualHeight / 2} stroke="currentColor" strokeWidth="0.5" />
                </g>
            )}

            {showThreshold && (
                <line
                    x1={0}
                    y1={padding + innerHeight - ((thresholdValue - minValue) / effectiveRange) * innerHeight}
                    x2={actualWidth}
                    y2={padding + innerHeight - ((thresholdValue - minValue) / effectiveRange) * innerHeight}
                    stroke="rgba(255, 59, 48, 0.4)"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                />
            )}

            <path d={areaData} fill={`url(#${gradientId})`} />
            <path d={pathData} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Last point indicator */}
            <circle
                cx={points[points.length - 1].x}
                cy={points[points.length - 1].y}
                r="2"
                fill={color}
                className="sparkline-pulse"
            />
        </svg>
    );
};

export default Sparkline;
