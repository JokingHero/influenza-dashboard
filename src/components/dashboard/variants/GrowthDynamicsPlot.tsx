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
      const growthRate = prev.count > 0 ? (weeklyNew / prev.count) : 0;
      data.push({
        yearweek: curr.yearweek.toString(),
        weeklyNew: weeklyNew,
        growthRate: growthRate,
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
    const margin = { top: 20, right: 60, bottom: 40, left: 60 };

    const x = d3.scaleBand<string>()
      .domain(processedData.map(d => d.yearweek))
      .range([margin.left, width - margin.right])
      .padding(0.2);

    const y0 = d3.scaleLinear()
      .domain([0, d3.max(processedData, d => d.weeklyNew) as number])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const y1 = d3.scaleLinear()
      .domain(d3.extent(processedData, d => d.growthRate) as [number, number])
      .nice()
      .range([height - margin.bottom, margin.top]);

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // BARS (Weekly New Detections)
    svg.append('g')
      .selectAll('rect')
      .data(processedData)
      .join('rect')
        .attr('x', d => x(d.yearweek) as number)
        .attr('y', d => y0(d.weeklyNew))
        .attr('width', x.bandwidth())
        .attr('height', d => y0(0) - y0(d.weeklyNew))
        .attr('fill', 'var(--color-chart-3)');

    // LINE (Weekly Growth Rate)
    const line = d3.line<{ yearweek: string, growthRate: number }>()
      .x(d => (x(d.yearweek) as number) + x.bandwidth() / 2)
      .y(d => y1(d.growthRate));

    svg.append('path')
      .datum(processedData)
      .attr('fill', 'none')
      .attr('stroke', 'var(--color-chart-1)')
      .attr('stroke-width', 2)
      .attr('d', line);

    // X AXIS
    const xAxis = svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickValues(x.domain().filter((_d, i) => i % 3 === 0))); // Show fewer ticks
    xAxis.selectAll("text").style("font-size", "12px").attr('fill', 'var(--color-foreground)');
    xAxis.selectAll(".domain, .tick line").attr('stroke', 'var(--color-border)');

    // Y0 AXIS (Left - Bars)
    const y0Axis = svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y0).ticks(5, 's'));
    y0Axis.selectAll("text").style("font-size", "12px").attr('fill', 'var(--color-foreground)');
    y0Axis.selectAll(".domain, .tick line").attr('stroke', 'var(--color-border)');

    // Y1 AXIS (Right - Line)
    const y1Axis = svg.append('g')
      .attr('transform', `translate(${width - margin.right}, 0)`)
      .call(d3.axisRight(y1).ticks(5, '.0%'));
    y1Axis.selectAll("text").style("font-size", "12px").attr('fill', 'var(--color-foreground)');
    y1Axis.selectAll(".domain, .tick line").attr('stroke', 'var(--color-border)');
    
    // Y Axis Labels
    svg.append("text").attr("transform", "rotate(-90)").attr("y", 15).attr("x", 0 - (height / 2))
      .style("text-anchor", "middle").style("font-size", "12px").attr("fill", "var(--color-foreground)").text("Weekly New Detections");
    svg.append("text").attr("transform", "rotate(-90)").attr("y", width - 15).attr("x", 0 - (height / 2))
      .style("text-anchor", "middle").style("font-size", "12px").attr("fill", "var(--color-foreground)").text("Weekly Growth Rate (%)");

  }, [processedData]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Growth Dynamics</CardTitle>
        <CardDescription>Weekly new detections (bars) and growth rate (line).</CardDescription>
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