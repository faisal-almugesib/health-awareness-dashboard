import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export interface BarDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarDatum[];
  title: string;
  /**
   * 'dumbbells' renders an ISOTYPE-style pictogram — one dumbbell icon per
   * `unitsPerIcon` — for the activity chart. 'bars' renders plain bars.
   */
  variant?: 'bars' | 'dumbbells';
  /** Percentage points represented by a single icon (dumbbells variant). */
  unitsPerIcon?: number;
  format?: (value: number) => string;
}

const WIDTH = 640;
const HEIGHT = 400;
const MARGIN = { top: 48, right: 20, bottom: 36, left: 44 };

const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  variant = 'bars',
  unitsPerIcon = 10,
  format = v => `${v}%`,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    const root = d3.select(svgRef.current);
    root.selectAll('*').remove();

    const width = WIDTH - MARGIN.left - MARGIN.right;
    const height = HEIGHT - MARGIN.top - MARGIN.bottom;

    const svg = root
      .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
      .attr('class', 'responsive-svg')
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const x = d3.scaleBand().domain(data.map(d => d.label)).range([0, width]).padding(0.25);
    const y = d3
      .scaleLinear()
      .domain([0, (d3.max(data, d => d.value) || 0) * 1.1])
      .nice()
      .range([height, 0]);

    svg.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x));
    svg.append('g').call(d3.axisLeft(y).ticks(6));

    if (variant === 'dumbbells') {
      drawPictogram(svg, data, x, y, height, unitsPerIcon);
    } else {
      drawBars(svg, data, x, y, height);
    }

    // Invisible hover targets covering each column, so tooltips work for
    // both variants without interfering with the animations.
    const hover = svg
      .selectAll('.hover-zone')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'hover-zone')
      .attr('x', d => x(d.label) || 0)
      .attr('y', 0)
      .attr('width', x.bandwidth())
      .attr('height', height)
      .attr('fill', 'transparent');

    hover
      .on('mouseover', (_event, d) => {
        const tip = svg
          .append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${(x(d.label) || 0) + x.bandwidth() / 2}, ${y(d.value) - 14})`);
        tip
          .append('rect')
          .attr('x', -38)
          .attr('y', -22)
          .attr('width', 76)
          .attr('height', 22)
          .attr('fill', 'rgba(0, 0, 0, 0.8)')
          .attr('rx', 5);
        tip
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('y', -7)
          .attr('fill', 'white')
          .style('font-size', '12px')
          .text(format(d.value));
      })
      .on('mouseout', () => svg.selectAll('.tooltip').remove());

    // Value labels appear once the entrance animation has finished
    svg
      .selectAll('.value-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'value-label')
      .attr('x', d => (x(d.label) || 0) + x.bandwidth() / 2)
      .attr('y', d => y(d.value) - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .style('opacity', 0)
      .text(d => format(d.value))
      .transition()
      .delay((_d, i) => i * 200 + 800)
      .duration(400)
      .style('opacity', 1);

    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', -MARGIN.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', '600')
      .text(title);
  }, [data, title, variant, unitsPerIcon, format]);

  return <svg ref={svgRef} />;
};

function drawBars(
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  data: BarDatum[],
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number>,
  height: number,
) {
  svg
    .selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.label) || 0)
    .attr('width', x.bandwidth())
    .attr('rx', 6)
    .attr('fill', '#667eea')
    .attr('y', height)
    .attr('height', 0)
    .transition()
    .delay((_d, i) => i * 150)
    .duration(700)
    .ease(d3.easeCubicOut)
    .attr('y', d => y(d.value))
    .attr('height', d => height - y(d.value));
}

/** One dumbbell per `unitsPerIcon` units, stacked bottom-up (ISOTYPE style). */
function drawPictogram(
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  data: BarDatum[],
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number>,
  height: number,
  unitsPerIcon: number,
) {
  const iconUrl = `${process.env.PUBLIC_URL}/images/dumbell.png`;
  const iconH = height - y(unitsPerIcon);
  const iconW = Math.min(x.bandwidth() * 0.65, iconH * 1.6);

  data.forEach((d, col) => {
    const icons = Math.max(1, Math.round(d.value / unitsPerIcon));
    const cx = (x(d.label) || 0) + x.bandwidth() / 2;
    for (let i = 0; i < icons; i++) {
      svg
        .append('image')
        .attr('href', iconUrl)
        .attr('x', cx - iconW / 2)
        .attr('y', height - (i + 1) * iconH + iconH * 0.05)
        .attr('width', iconW)
        .attr('height', iconH * 0.9)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('opacity', 0)
        .transition()
        .delay(col * 200 + i * 90)
        .duration(250)
        .style('opacity', 0.95);
    }
  });
}

export default BarChart;
