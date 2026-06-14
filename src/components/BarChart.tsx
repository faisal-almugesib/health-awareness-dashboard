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
   * 'dumbbells' renders an ISOTYPE-style pictogram — one dumbbell glyph per
   * `unitsPerIcon` — for the activity chart. 'bars' renders plain bars.
   */
  variant?: 'bars' | 'dumbbells';
  /** Percentage points represented by a single glyph (dumbbells variant). */
  unitsPerIcon?: number;
  format?: (value: number) => string;
}

const WIDTH = 640;
const HEIGHT = 400;
const MARGIN = { top: 48, right: 20, bottom: 36, left: 44 };

const ACCENT = '#6366f1';
const INK = '#0f172a';
const INK_SOFT = '#334155';

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
          .attr('y', -23)
          .attr('width', 76)
          .attr('height', 23)
          .attr('fill', INK)
          .attr('rx', 6);
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
      .style('fill', INK_SOFT)
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
      .style('font-size', '15px')
      .style('font-weight', '600')
      .style('fill', INK)
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
    .attr('fill', ACCENT)
    .attr('y', height)
    .attr('height', 0)
    .transition()
    .delay((_d, i) => i * 150)
    .duration(700)
    .ease(d3.easeCubicOut)
    .attr('y', d => y(d.value))
    .attr('height', d => height - y(d.value));
}

/**
 * A dumbbell drawn from scratch with SVG rects (no image assets): end caps,
 * outer + inner plates, and a thinner handle, all vertically centred.
 */
function appendDumbbell(
  parent: d3.Selection<SVGGElement, unknown, null, undefined>,
  w: number,
  h: number,
) {
  const cy = h / 2;
  const piece = (px: number, pw: number, ph: number, fill: string) =>
    parent
      .append('rect')
      .attr('x', px)
      .attr('y', cy - ph / 2)
      .attr('width', pw)
      .attr('height', ph)
      .attr('rx', Math.min(3, pw / 2))
      .attr('fill', fill);

  const capW = 0.05 * w;
  const outerW = 0.1 * w;
  const innerW = 0.12 * w;
  const handleW = w - 2 * (capW + outerW + innerW);

  piece(capW + outerW + innerW, handleW, 0.2 * h, '#a5b4fc'); // handle
  piece(capW + outerW, innerW, 0.95 * h, '#4f46e5'); // inner plates
  piece(w - capW - outerW - innerW, innerW, 0.95 * h, '#4f46e5');
  piece(capW, outerW, 0.66 * h, ACCENT); // outer plates
  piece(w - capW - outerW, outerW, 0.66 * h, ACCENT);
  piece(0, capW, 0.28 * h, '#818cf8'); // end caps
  piece(w - capW, capW, 0.28 * h, '#818cf8');
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
  const slotH = height - y(unitsPerIcon);
  const glyphH = slotH * 0.74;
  const glyphW = Math.min(x.bandwidth() * 0.7, glyphH * 2.4);

  data.forEach((d, col) => {
    const icons = Math.max(1, Math.round(d.value / unitsPerIcon));
    const cx = (x(d.label) || 0) + x.bandwidth() / 2;
    for (let i = 0; i < icons; i++) {
      const yTop = height - (i + 1) * slotH + (slotH - glyphH) / 2;
      const glyph = svg
        .append('g')
        .attr('transform', `translate(${cx - glyphW / 2}, ${yTop + 8})`)
        .style('opacity', 0);
      appendDumbbell(glyph, glyphW, glyphH);
      glyph
        .transition()
        .delay(col * 200 + i * 90)
        .duration(300)
        .ease(d3.easeCubicOut)
        .style('opacity', 1)
        .attr('transform', `translate(${cx - glyphW / 2}, ${yTop})`);
    }
  });
}

export default BarChart;
