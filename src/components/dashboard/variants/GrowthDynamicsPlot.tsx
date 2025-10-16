import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { type EmergingVariant } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface GrowthDynamicsPlotProps {
  variant: EmergingVariant | null;
}

const GrowthDynamicsPlot: React.FC<GrowthDynamicsPlotProps> = ({ variant }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const processedData = useMemo(() => {
    if (!variant || !variant.cumLoc || variant.cumLoc.length < 2) return [];

    const data = [];
    for (let i = 1; i < variant.cumLoc.length; i++) {
      const prev = variant.cumLoc[i - 1];
      const curr = variant.cumLoc[i];
      const weeklyNew = curr.count - prev.count;
      data.push({
        yearweek: curr.yearweek.toString(),
        weeklyNew: weeklyNew,
      });
    }
    return data;
  }, [variant]);

  useEffect(() => {
    if (!svgRef.current || processedData.length === 0) {
        d3.select(svgRef.current).selectAll('*').remove();
        return;
    };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 400;
    const margin = { top: 40, right: 40, bottom: 70, left: 70 };

    const x = d3.scaleBand<string>()
      .domain(processedData.map(d => d.yearweek))
      .range([margin.left, width - margin.right])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(processedData, d => d.weeklyNew) as number])
      .nice()
      .range([height - margin.bottom, margin.top]);

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // BARS (Weekly New Detections)
    svg.append('g')
      .selectAll('rect')
      .data(processedData)
      .join('rect')
        .attr('x', d => x(d.yearweek) as number)
        .attr('y', d => y(d.weeklyNew))
        .attr('width', x.bandwidth())
        .attr('height', d => y(0) - y(d.weeklyNew))
        .attr('fill', 'var(--color-chart-3)');

    // X AXIS
    const xAxis = svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x)
        .tickValues(x.domain().filter((_d, i) => i % 2 === 0)) // Show ticks more often
        .tickFormat(d => `W${d.substring(4)}`) // Format to "W##"
      );
    xAxis.selectAll("text")
      .style("font-size", "20px") 
      .attr('fill', 'var(--color-foreground)')
      .style("text-anchor", "middle");
    xAxis.selectAll(".domain, .tick line").attr('stroke', 'var(--color-border)');

    // Y AXIS (Left - Bars)
    const yAxis = svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y).ticks(5, 's'));
    yAxis.selectAll("text").style("font-size", "20px").attr('fill', 'var(--color-foreground)');
    yAxis.selectAll(".domain, .tick line").attr('stroke', 'var(--color-border)');
    
    // Y Axis Label
    svg.append("text").attr("transform", "rotate(-90)").attr("y", 15).attr("x", 0 - (height / 2))
      .style("text-anchor", "middle").style("font-size", "22px").attr("fill", "var(--color-foreground)").text("Weekly New Detections");
    
    // X Axis Label
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height - 5)
      .style("font-size", "22px")
      .attr("fill", "var(--color-foreground)")
      .text("2025 Weeks");


  }, [processedData]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Growth Dynamics</CardTitle>
        <CardDescription>Weekly new detections for the selected variant.</CardDescription>
      </CardHeader>
      <CardContent>
        <svg ref={svgRef} className="w-full h-auto" />
        {processedData.length === 0 && (
             <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                Not enough data for growth dynamics.
            </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GrowthDynamicsPlot;