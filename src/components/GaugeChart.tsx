import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface GaugeChartProps {
  value: number;
  target: number;
  title: string;
  unit: string;
}



const GaugeChart: React.FC<GaugeChartProps> = ({ value, target, title, unit }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    const width = 400;
    const height = 300;

    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("class", "responsive-svg gauge-svg")
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Create heart path (scaled and centered)
    const heartPath = "M0,-40 C-25,-65 -65,-35 -65,-5 C-65,15 -35,35 0,65 C35,35 65,15 65,-5 C65,-35 25,-65 0,-40 Z";

    // Create gradient for the heart fill
    const defs = svg.append("defs");
    
    const gradient = defs.append("linearGradient")
      .attr("id", "heartGradient")
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "0%")
      .attr("y2", "0%");

    // Calculate fill percentage
    const fillPercentage = Math.min(value, 100);
    
    gradient.append("stop")
      .attr("offset", `${100 - fillPercentage}%`)
      .attr("stop-color", value >= target ? "#ff6b6b" : "#ff8fab")
      .attr("stop-opacity", 1);

    gradient.append("stop")
      .attr("offset", `${100 - fillPercentage}%`)
      .attr("stop-color", "#e6e6e6")
      .attr("stop-opacity", 1);

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#d0d0d0")
      .attr("stop-opacity", 1);

    // Create pulsing animation
    const pulseAnimation = svg.append("g")
      .attr("class", "pulse-group");

    // Background heart (outline)
    pulseAnimation.append("path")
      .attr("d", heartPath)
      .style("fill", "none")
      .style("stroke", "#ddd")
      .style("stroke-width", 2);

    // Filled heart with pulsing animation
    pulseAnimation.append("path")
      .attr("d", heartPath)
      .style("fill", "url(#heartGradient)")
      .style("stroke", value >= target ? "#ff1744" : "#ff4081")
      .style("stroke-width", 2);

    // Add pulsing animation to the entire heart group
    function startPulseAnimation() {
      pulseAnimation
        .transition()
        .duration(800)
        .ease(d3.easeSinInOut)
        .attr("transform", "scale(1.08)")
        .transition()
        .duration(800)
        .ease(d3.easeSinInOut)
        .attr("transform", "scale(1)")
        .on("end", startPulseAnimation);
    }
    
    // Start the pulsing animation
    startPulseAnimation();



    // Heart monitoring line (ECG/EKG style wavy line at target level)
    if (target < 100) {
      const targetY = 65 - (target / 100) * 105; // Heart height is approximately 105px
      
      // Create ECG heartbeat pattern data
      const ecgData: { x: number; y: number }[] = [];
      const lineWidth = 150; // Total width of the line
      const startX = -75;
      
      // Generate ECG pattern points
      for (let i = 0; i <= 100; i++) {
        const x = startX + (i / 100) * lineWidth;
        let y = targetY;
        
        // Create heartbeat spikes at regular intervals
        const progress = (i / 100) * 4; // 4 heartbeats across the line
        const beatPhase = (progress % 1) * 2 * Math.PI;
        
        if (progress % 1 < 0.1) {
          // Sharp spike up
          y += -15 * Math.sin(beatPhase * 5);
        } else if (progress % 1 < 0.15) {
          // Sharp spike down
          y += 8 * Math.sin((beatPhase - 0.1 * 2 * Math.PI) * 10);
        } else if (progress % 1 < 0.25) {
          // Smaller spike up
          y += -5 * Math.sin((beatPhase - 0.15 * 2 * Math.PI) * 8);
        } else {
          // Baseline with slight noise
          y += Math.sin(beatPhase * 0.5) * 1;
        }
        
        ecgData.push({ x, y });
      }
      
      // Create line generator for ECG
      const ecgLine = d3.line<{ x: number; y: number }>()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveCardinal);
      
      const pathD = ecgLine(ecgData);
      if (!pathD) return; // Exit if path data is not valid

      // Draw the ECG line
      svg.append("path")
        .attr("d", pathD)
        .attr("fill", "none")
        .attr("stroke", "#dc3545")
        .attr("stroke-width", 2);
      
      // Add single animated pulse dot along the line using CSS animations
      svg.append("circle")
        .attr("r", 4)
        .attr("fill", "#dc3545")
        .attr("opacity", 0.9)
        .style("filter", "drop-shadow(0 0 5px #dc3545)")
        .style("offset-path", `path('${pathD}')`)
        .style("animation", "move-along-path 4s linear infinite");

      // Target label positioned to the right of the ECG line
      svg.append("text")
        .attr("x", startX + lineWidth + 10)
        .attr("y", targetY + 4)
        .attr("text-anchor", "start")
        .style("font-size", "14px")
        .style("fill", "#dc3545")
        .style("font-weight", "bold")
        .text(`Target: ${target}${unit}`);
    }

    // Value text sits in the lower lobe of the heart so it stays on the
    // filled (red) area for any value above ~45%
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.4em")
      .style("font-size", "1.7em")
      .style("font-weight", "bold")
      .style("fill", "#fff")
      .style("text-shadow", "1px 1px 3px rgba(0,0,0,0.45)")
      .text(`${value}${unit}`);

    // Title above the heart
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-5.5em")
      .style("font-size", "1.2em")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .text(title);

    // Status text below the heart
    const statusText = value >= target ? "Target Achieved!" : "In Progress";
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "6em")
      .style("font-size", "1em")
      .style("fill", value >= target ? "#28a745" : "#666")
      .style("font-weight", "bold")
      .text(statusText);

  }, [value, target, title, unit]);

  return <svg ref={svgRef}></svg>;
};

export default GaugeChart; 