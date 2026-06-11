import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface DataSeries {
  name: string;
  color: string;
  data: { year: string; value: number }[];
}

interface Annotation {
  year: string;
  label: string;
}

interface MultiLineChartProps {
  data: DataSeries[];
  title: string;
  yAxisLabel: string;
  /** Optional dashed marker lines for notable years. */
  annotations?: Annotation[];
}

const WIDTH = 700;
const HEIGHT = 400;
const MARGIN = { top: 40, right: 130, bottom: 60, left: 60 };

const MultiLineChart: React.FC<MultiLineChartProps> = ({
  data,
  title,
  yAxisLabel,
  annotations = [],
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

    const yearSet = new Set(data.flatMap(d => d.data.map(p => p.year)));
    const allYears = Array.from(yearSet).sort();
    const maxValue = d3.max(data.flatMap(d => d.data.map(p => p.value))) || 0;

    const x = d3.scalePoint().domain(allYears).range([0, width]);
    const y = d3.scaleLinear().domain([0, maxValue]).nice().range([height, 0]);

    const line = d3
      .line<{ year: string; value: number }>()
      .x(d => x(d.year) || 0)
      .y(d => y(d.value));

    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    svg.append('g').call(d3.axisLeft(y));

    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - MARGIN.left)
      .attr('x', 0 - height / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '13px')
      .text(yAxisLabel);

    // Annotation markers (e.g. "First Saudi women compete — London 2012")
    annotations.forEach(a => {
      const ax = x(a.year);
      if (ax === undefined) return;
      svg
        .append('line')
        .attr('x1', ax)
        .attr('x2', ax)
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', '#999')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4');
      svg
        .append('text')
        .attr('x', ax)
        .attr('y', -8)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('fill', '#666')
        .text(a.label);
    });

    data.forEach(series => {
      const path = svg
        .append('path')
        .datum(series.data)
        .attr('fill', 'none')
        .attr('stroke', series.color)
        .attr('stroke-width', 2)
        .attr('d', line);

      // Draw each line in from left to right
      const length = (path.node() as SVGPathElement).getTotalLength();
      path
        .attr('stroke-dasharray', `${length} ${length}`)
        .attr('stroke-dashoffset', length)
        .transition()
        .duration(1200)
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0)
        .on('end', () => path.attr('stroke-dasharray', 'none'));

      svg
        .selectAll(`.dot-${series.name.replace(/\s+/g, '-')}`)
        .data(series.data)
        .enter()
        .append('circle')
        .attr('cx', d => x(d.year) || 0)
        .attr('cy', d => y(d.value))
        .attr('r', 4)
        .attr('fill', series.color)
        .style('cursor', 'default')
        .on('mouseover', (_event, d) => {
          const tip = svg
            .append('g')
            .attr('class', 'tooltip')
            .attr('transform', `translate(${x(d.year) || 0}, ${y(d.value) - 16})`);
          tip
            .append('rect')
            .attr('x', -62)
            .attr('y', -22)
            .attr('width', 124)
            .attr('height', 22)
            .attr('fill', 'rgba(0, 0, 0, 0.8)')
            .attr('rx', 5);
          tip
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('y', -7)
            .attr('fill', 'white')
            .style('font-size', '11px')
            .text(`${series.name} ${d.year}: ${d.value}`);
        })
        .on('mouseout', () => svg.selectAll('.tooltip').remove());
    });

    const legend = svg.append('g').attr('transform', `translate(${width + 20}, 20)`);
    data.forEach((series, i) => {
      const row = legend.append('g').attr('transform', `translate(0, ${i * 20})`);
      row.append('rect').attr('width', 10).attr('height', 10).attr('fill', series.color);
      row
        .append('text')
        .attr('x', 15)
        .attr('y', 5)
        .attr('dy', '0.35em')
        .style('font-size', '12px')
        .text(series.name);
    });

    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', -MARGIN.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text(title);
  }, [data, title, yAxisLabel, annotations]);

  return <svg ref={svgRef} />;
};

export default MultiLineChart;
