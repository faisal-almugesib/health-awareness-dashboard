import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import './LightPollutionChart.css';

interface LightPollutionData {
  country: string;
  radiance: number;
  flagCode: string;
}

const data: LightPollutionData[] = [
  { country: 'Singapore', radiance: 43.45, flagCode: 'sg' },
  { country: 'Qatar', radiance: 19.90, flagCode: 'qa' },
  { country: 'Kuwait', radiance: 10.22, flagCode: 'kw' },
  { country: 'UAE', radiance: 6.14, flagCode: 'ae' },
];

const getGlowColor = (flagCode: string): string => {
  const colors: { [key: string]: string } = {
    sg: '#ed2939',
    qa: '#8a1538',
    kw: '#007a3d',
    ae: '#00732f',
  };
  return colors[flagCode] || '#f0f0f0';
};

const LightPollutionChart: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const margin = { top: 60, right: 40, bottom: 80, left: 60 };
    const width = 960 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const chart = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // --- Scales ---
    const xScale = d3
      .scaleBand<string>()
      .domain(data.map(d => d.country))
      .range([0, width])
      .padding(0.6);

    const beamHeightScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, d => d.radiance) || 0])
      .range([0, height / 2]);

    // --- Y-Axis ---
    const yAxisScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.radiance) || 0])
      .nice()
      .range([0, height / 2]); 

    const yAxis = d3.axisLeft(yAxisScale).ticks(5);

    chart.append("g")
      .attr("class", "y-axis")
      .call(yAxis);
      
    // --- Tooltip ---
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // --- Gradients and Filters ---
    const defs = chart.append('defs');

    // Glow Filter
    const glowFilter = defs
      .append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    glowFilter
      .append('feGaussianBlur')
      .attr('stdDeviation', 15)
      .attr('result', 'coloredBlur');

    // Beam Gradients
    data.forEach(d => {
      const gradient = defs
        .append('linearGradient')
        .attr('id', `beam-gradient-${d.flagCode}`)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');
      gradient.append('stop').attr('offset', '0%').attr('stop-color', getGlowColor(d.flagCode)).attr('stop-opacity', 0.8);
      gradient.append('stop').attr('offset', '100%').attr('stop-color', getGlowColor(d.flagCode)).attr('stop-opacity', 0);
    });

    // --- Street Lamps ---
    const lampGroup = chart
      .selectAll('.lamp-group')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'lamp-group')
      .attr('transform', d => `translate(${xScale(d.country)! + xScale.bandwidth() / 2}, 0)`)
      .on("mouseover", function(event, d) {
          tooltip.transition().duration(200).style("opacity", .9);
          tooltip.html(`<strong>${d.country}</strong><br/>Radiance: ${d.radiance.toFixed(2)}`)
              .style("left", (event.pageX + 5) + "px")
              .style("top", (event.pageY - 28) + "px");
      })
      .on("mousemove", function(event, d) {
          tooltip.style("left", (event.pageX + 5) + "px")
                 .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {
          tooltip.transition().duration(500).style("opacity", 0);
      });

    // Lamp Post
    lampGroup
      .append('rect')
      .attr('class', 'lamp-post')
      .attr('x', -5)
      .attr('y', 0)
      .attr('width', 10)
      .attr('height', height / 2)
      .attr('fill', '#333');

    // Lamp Head
    lampGroup
      .append('path')
      .attr('class', 'lamp-head')
      .attr('d', 'M -25,0 Q 0,-15 25,0 Z')
      .attr('fill', '#555');

    // Light Beam
    lampGroup
        .append('rect')
        .attr('class', 'light-beam')
        .attr('x', -15)
        .attr('y', 0)
        .attr('width', 30)
        .attr('height', d => beamHeightScale(d.radiance))
        .attr('fill', d => `url(#beam-gradient-${d.flagCode})`);

    // Flag
    lampGroup
        .append('foreignObject')
        .attr('x', 10)
        .attr('y', height / 4 - 40)
        .attr('width', 48)
        .attr('height', 32)
        .html(d => `<div class="flag-container flag-${d.flagCode}"></div>`);

    // Country Name
    chart
      .selectAll('.country-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'country-label')
      .attr('x', d => xScale(d.country)! + xScale.bandwidth() / 2)
      .attr('y', height + 40)
      .attr('text-anchor', 'middle')
      .text(d => d.country);

  }, []);

  return (
    <div className="light-pollution-chart-container">
        <h3>Most Light-Polluted Countries</h3>
        <p>Represented by Street Lamp Glow</p>
        <svg ref={svgRef}></svg>
    </div>
  );
};

export default LightPollutionChart; 