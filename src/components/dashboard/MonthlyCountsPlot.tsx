import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { type WeekRegionData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface MonthlyCountsPlotProps {
  data: WeekRegionData;
  variantName: string;
}

interface MonthlyCount {
  month: string;
  count: number;
}

const MonthlyCountsPlot: React.FC<MonthlyCountsPlotProps> = ({ data, variantName }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [processedData, setProcessedData] = useState<MonthlyCount[]>([]);

  useEffect(() => {
    const monthlyCounts = new Map<string, number>();
    
    data.forEach(continent => {
      continent.weeklyData.forEach(week => {
        const d = new Date(week.year, 0, 1 + (parseInt(week.weekNum) - 1) * 7);
        const monthKey = d3.timeFormat('%Y-%m')(d);
        const currentCount = monthlyCounts.get(monthKey) || 0;
        monthlyCounts.set(monthKey, currentCount + week.numIsolates);
      });
    });

    const counts: MonthlyCount[] = Array.from(monthlyCounts.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    setProcessedData(counts);
  }, [data]);

  useEffect(() => {
    if (!svgRef.current || processedData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 70, left: 60 };

    const x = d3.scaleBand()
      .domain(processedData.map(d => d.month))
      .range([margin.left, width - margin.right])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(processedData, d => d.count) as number])
      .nice()
      .range([height - margin.bottom, margin.top]);

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g');

    g.selectAll('rect')
      .data(processedData)
      .join('rect')
      .attr('x', d => x(d.month) as number)
      .attr('y', d => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', d => y(0) - y(d.count))
      .attr('fill', 'var(--color-chart-4)');

    const xAxis = g.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0));
    
    xAxis.selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");

    g.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

  }, [processedData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Counts by Month ({variantName})</CardTitle>
        <CardDescription>Total number of sequences submitted per month.</CardDescription>
      </CardHeader>
      <CardContent>
        <svg ref={svgRef} className="w-full h-auto" />
      </CardContent>
    </Card>
  );
};

export default MonthlyCountsPlot;