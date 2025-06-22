import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface DataPoint {
  year: string;
  total_pct: number;
}

interface BarChartProps {
  data: DataPoint[];
  title: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, title }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 50, right: 20, bottom: 30, left: 40 }; //the margin of the svg in pixels
    const width = 600 - margin.left - margin.right; //the width of the svg in pixels
    const height = 400 - margin.top - margin.bottom; //the height of the svg in pixels

    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g") //append a group element to the svg
      .attr("transform", `translate(${margin.left},${margin.top})`); //translate the group element to the left and top of the svg

    const x = d3.scaleBand() //create a categorical scale for the x axis
      .domain(data.map(d => d.year)) //the catigories of the x axis
      .range([0, width]) //the range of pixels the x axis will be in the svg width
      .padding(0.1); //the padding between the bars

    const y = d3.scaleLinear() //create a linear scale for the y axis
      .domain([0, d3.max(data, d => +d.total_pct) || 0]) //the domain of the y axis
      .nice() //round the y axis to the nearest integer
      .range([height, 0]); //the range of pixels the y axis will be in the svg height

    // Add X axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    // Add Y axis
    svg.append("g")
      .call(d3.axisLeft(y));

    // Calculate dumbbell dimensions with dynamic scaling
    const baseWidth = Math.min(x.bandwidth() * 0.8, 70);
    const minDumbbellHeight = 25;

    // Add dumbbell images with sequential animation
    const dumbbells = svg.selectAll(".dumbbell-bar")
      .data(data)
      .enter().append("image")
      .attr("class", "dumbbell-bar")
      .attr("href", "/images/dumbell.png")
      .attr("x", d => {
        const barHeight = Math.max(height - y(+d.total_pct), minDumbbellHeight);
        const dynamicWidth = barHeight < 50 ? baseWidth * 0.8 : 
                           barHeight < 100 ? baseWidth * 0.9 : 
                           barHeight < 150 ? baseWidth : 
                           baseWidth * 1.1;
        return (x(d.year) || 0) + (x.bandwidth() - dynamicWidth) / 2;
      })
      .attr("y", d => height) // Start from bottom
      .attr("width", d => {
        const barHeight = Math.max(height - y(+d.total_pct), minDumbbellHeight);
        return barHeight < 50 ? baseWidth * 0.8 : 
               barHeight < 100 ? baseWidth * 0.9 : 
               barHeight < 150 ? baseWidth : 
               baseWidth * 1.1;
      })
      .attr("height", 0) // Start with zero height
      .attr("opacity", 0.9)
      .attr("preserveAspectRatio", "none")
      .style("cursor", "pointer")
      .style("pointer-events", "all")
      .on("mouseover", function(event, d) {
        // Only show tooltip, no visual changes to the dumbbell
        const tooltip = svg.append("g")
          .attr("class", "tooltip")
          .attr("transform", `translate(${(x(d.year) || 0) + x.bandwidth()/2}, ${y(+d.total_pct) - 20})`);
        
        tooltip.append("rect")
          .attr("x", -30)
          .attr("y", -25)
          .attr("width", 60)
          .attr("height", 20)
          .attr("fill", "rgba(0, 0, 0, 0.8)")
          .attr("rx", 5);
        
        tooltip.append("text")
          .attr("text-anchor", "middle")
          .attr("y", -10)
          .attr("fill", "white")
          .style("font-size", "12px")
          .text(`${d.total_pct}%`);
      })
      .on("mouseout", function() {
        svg.selectAll(".tooltip").remove();
      });

    // Animate bars growing one by one
    dumbbells.each(function(d, i) {
      const finalHeight = Math.max(height - y(+d.total_pct), minDumbbellHeight);
      const finalY = y(+d.total_pct);
      
      d3.select(this)
        .transition()
        .delay(i * 300) // 300ms delay between each bar
        .duration(800) // 800ms growth duration
        .ease(d3.easeBounceOut) 
        .attr("y", finalY)
        .attr("height", finalHeight);
    });

    // Add value labels with delayed appearance
    const labels = svg.selectAll(".value-label")
      .data(data)
      .enter().append("text")
      .attr("class", "value-label")
      .attr("x", d => (x(d.year) || 0) + x.bandwidth() / 2)
      .attr("y", d => y(+d.total_pct) - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .style("opacity", 0) // Start invisible
      .text(d => `${d.total_pct}%`);

    // Animate labels appearing after bars finish growing
    labels.each(function(d, i) {
      d3.select(this)
        .transition()
        .delay(i * 300 + 800 + 200) // Bar delay + bar duration + extra 200ms
        .duration(400)
        .ease(d3.easeBackOut)
        .style("opacity", 1)
        .attr("transform", "scale(1.2)")
        .transition()
        .duration(200)
        .attr("transform", "scale(1)");
    });

    // Add title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text(title);

  }, [data, title]);

  return <svg ref={svgRef}></svg>;
};

export default BarChart; 