import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface DataSeries {
  name: string;
  color: string;
  data: { year: string; value: number }[];
}

interface MultiLineChartProps {
  data: DataSeries[];
  title: string;
  yAxisLabel: string;
}

const MultiLineChart: React.FC<MultiLineChartProps> = ({ data, title, yAxisLabel }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 40, right: 120, bottom: 60, left: 60 };
    const width = 700 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Get all years and values
    const yearSet = new Set(data.flatMap(d => d.data.map(p => p.year)));
    const allYears = Array.from(yearSet).sort();
    const maxValue = d3.max(data.flatMap(d => d.data.map(p => p.value))) || 0;

    // X scale
    const x = d3.scalePoint()
      .domain(allYears)
      .range([0, width]);

    // Y scale
    const y = d3.scaleLinear()
      .domain([0, maxValue])
      .nice()
      .range([height, 0]);

    // Line generator
    const line = d3.line<{ year: string; value: number }>()
      .x(d => x(d.year) || 0)
      .y(d => y(d.value));

    // Add X axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    // Add Y axis
    svg.append("g")
      .call(d3.axisLeft(y));

    // Add Y axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text(yAxisLabel);

    // Add lines
    data.forEach(series => {
      svg.append("path")
        .datum(series.data)
        .attr("fill", "none")
        .attr("stroke", series.color)
        .attr("stroke-width", 2)
        .attr("d", line);

      // Add dots
      svg.selectAll(`.dot-${series.name}`)
        .data(series.data)
        .enter().append("circle")
        .attr("class", `dot-${series.name}`)
        .attr("cx", d => x(d.year) || 0)
        .attr("cy", d => y(d.value))
        .attr("r", 4)
        .attr("fill", series.color);
    });

    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width + 20}, 20)`);

    data.forEach((series, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);

      legendRow.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", series.color);

      legendRow.append("text")
        .attr("x", 15)
        .attr("y", 5)
        .attr("dy", "0.35em")
        .style("font-size", "12px")
        .text(series.name);
    });

    // Add title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(title);

  }, [data, title, yAxisLabel]);

  return <svg ref={svgRef}></svg>;
};

export default MultiLineChart; 