import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface SparklineProps {
    data: number[];
    color?: string;
    showAxis?: boolean;
    suffix?: string;
    showGrid?: boolean;
    showThreshold?: boolean;
    thresholdValue?: number;
}

const Sparkline: React.FC<SparklineProps> = ({
    data,
    color = 'rgba(0, 122, 255, 1)',
    showAxis = true,
    suffix = '',
    showGrid = true,
    showThreshold = false,
    thresholdValue = 75,
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!svgRef.current || !containerRef.current || !data || data.length < 2) return;

        const container = containerRef.current;
        const svg = d3.select(svgRef.current);

        // Clear previous content
        svg.selectAll('*').remove();

        // Get container dimensions
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        if (containerWidth <= 0 || containerHeight <= 0) return;

        // Set margins
        const margin = {
            top: 2,
            right: 2,
            bottom: 2,
            left: showAxis ? 20 : 2
        };

        const width = containerWidth - margin.left - margin.right;
        const height = containerHeight - margin.top - margin.bottom;

        if (width <= 0 || height <= 0) return;

        // Create scales
        const xScale = d3.scaleLinear()
            .domain([0, data.length - 1])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([d3.min(data) as number, d3.max(data) as number])
            .range([height, 0])
            .nice();

        // Create main group
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Create gradient
        const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;
        const gradient = svg.append('defs')
            .append('linearGradient')
            .attr('id', gradientId)
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '100%');

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', color)
            .attr('stop-opacity', 0.3);

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', color)
            .attr('stop-opacity', 0.01);

        // Grid lines
        if (showGrid) {
            g.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', width)
                .attr('y2', 0)
                .attr('stroke', 'currentColor')
                .attr('stroke-width', 0.5)
                .attr('stroke-dasharray', '2,2')
                .attr('opacity', 0.1);

            g.append('line')
                .attr('x1', 0)
                .attr('y1', height)
                .attr('x2', width)
                .attr('y2', height)
                .attr('stroke', 'currentColor')
                .attr('stroke-width', 0.5)
                .attr('opacity', 0.1);
        }

        // Axis labels
        if (showAxis) {
            const maxVal = d3.max(data) as number;
            const minVal = d3.min(data) as number;

            g.append('text')
                .attr('x', -4)
                .attr('y', 4)
                .attr('text-anchor', 'end')
                .attr('font-size', '7px')
                .attr('font-weight', '900')
                .attr('fill', 'currentColor')
                .attr('opacity', 0.5)
                .text(`${Math.round(maxVal)}${suffix}`);

            g.append('text')
                .attr('x', -4)
                .attr('y', height - 1)
                .attr('text-anchor', 'end')
                .attr('font-size', '7px')
                .attr('font-weight', '900')
                .attr('fill', 'currentColor')
                .attr('opacity', 0.5)
                .text(`${Math.round(minVal)}${suffix}`);
        }

        // Threshold line
        if (showThreshold && thresholdValue) {
            g.append('line')
                .attr('x1', 0)
                .attr('y1', yScale(thresholdValue))
                .attr('x2', width)
                .attr('y2', yScale(thresholdValue))
                .attr('stroke', 'rgba(255, 59, 48, 0.4)')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '2,2');
        }

        // Create line generator with curve
        const line = d3.line<number>()
            .x((_, i) => xScale(i))
            .y(d => yScale(d))
            .curve(d3.curveCatmullRom.alpha(0.5));

        // Create area generator
        const area = d3.area<number>()
            .x((_, i) => xScale(i))
            .y0(height)
            .y1(d => yScale(d))
            .curve(d3.curveCatmullRom.alpha(0.5));

        // Draw area
        g.append('path')
            .datum(data)
            .attr('fill', `url(#${gradientId})`)
            .attr('d', area);

        // Draw line
        g.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 1.5)
            .attr('stroke-linecap', 'round')
            .attr('stroke-linejoin', 'round')
            .attr('d', line);

        // Draw last point
        const lastIndex = data.length - 1;
        g.append('circle')
            .attr('cx', xScale(lastIndex))
            .attr('cy', yScale(data[lastIndex]))
            .attr('r', 2)
            .attr('fill', color);

    }, [data, color, showAxis, suffix, showGrid, showThreshold, thresholdValue]);

    // Resize observer
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver(() => {
            // Trigger re-render by updating a dummy state or calling the render effect
            if (svgRef.current && containerRef.current) {
                const event = new Event('resize');
                window.dispatchEvent(event);
            }
        });

        resizeObserver.observe(containerRef.current);

        return () => resizeObserver.disconnect();
    }, []);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 0 }}>
            <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>
    );
};

export default Sparkline;
