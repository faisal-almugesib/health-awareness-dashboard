import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface DataPoint {
  year: string;
  total_pct: number;
}

interface BarChartProps {
  data: DataPoint[];
}

const BarChart: React.FC<BarChartProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", 600)
      .attr("height", 400);

    const x = d3.scaleBand() // create a categorical scale for the x axis
      .domain(data.map((d: DataPoint) => d.year)) //the range of the x axis
      .range([0, 600]) //the range in svg width in pixels
      .padding(0.1); //the padding between the bars

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, (d: DataPoint) => +d.total_pct) || 0])
      .nice()
      .range([400, 0]);

    svg.selectAll(".bar") 
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", (d: DataPoint) => x(d.year) || 0)
      .attr("y", (d: DataPoint) => y(+d.total_pct))
      .attr("width", x.bandwidth())
      .attr("height", (d: DataPoint) => 400 - y(+d.total_pct))
      .attr("fill", "steelblue");

  }, [data]);

  return <svg ref={svgRef}></svg>;
};

export default BarChart; 