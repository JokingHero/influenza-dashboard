import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { type WeekRegionData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface VariantProgressionPlotProps {
  h1n1Data: WeekRegionData;
  h3n2Data: WeekRegionData;
}

interface TimePoint {
  date: Date;
  h1n1Count: number;
  h3n2Count: number;
}

const VariantProgressionPlot: React.FC<VariantProgressionPlotProps> = ({ h1n1Data, h3n2Data }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [processedData, setProcessedData] = useState<TimePoint[]>([]);

  useEffect(() => {
    const processData = (data: WeekRegionData): Map<string, number> => {
      const weeklyCounts = new Map<string, number>();
      data.forEach(continent => {
        continent.weeklyData.forEach(week => {
          const key = `${week.year}-W${week.weekNum.padStart(2, '0')}`;
          const currentCount = weeklyCounts.get(key) || 0;
          weeklyCounts.set(key, currentCount + week.numIsolates);
        });
      });
      return weeklyCounts;
    };

    const h1n1Counts = processData(h1n1Data);
    const h3n2Counts = processData(h3n2Data);
    
    const allWeeks = new Set([...h1n1Counts.keys(), ...h3n2Counts.keys()]);

    const combinedData: TimePoint[] = Array.from(allWeeks).map(weekKey => {
      const [year, weekStr] = weekKey.split('-W');
      const weekNum = parseInt(weekStr, 10);
      const d = new Date(parseInt(year), 0, 1 + (weekNum - 1) * 7);

      return {
        date: d,
        h1n1Count: h1n1Counts.get(weekKey) || 0,
        h3n2Count: h3n2Counts.get(weekKey) || 0,
      };
    });

    combinedData.sort((a, b) => a.date.getTime() - b.date.getTime());
    setProcessedData(combinedData);
  }, [h1n1Data, h3n2Data]);

  useEffect(() => {
    if (!svgRef.current || processedData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };

    const x = d3.scaleTime()
      .domain(d3.extent(processedData, d => d.date) as [Date, Date])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(processedData, d => Math.max(d.h1n1Count, d.h3n2Count)) as number])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const lineH1N1 = d3.line<TimePoint>()
      .x(d => x(d.date))
      .y(d => y(d.h1n1Count));

    const lineH3N2 = d3.line<TimePoint>()
      .x(d => x(d.date))
      .y(d => y(d.h3n2Count));

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g');

    g.append('path')
      .datum(processedData)
      .attr('fill', 'none')
      .attr('stroke', 'var(--color-chart-1)')
      .attr('stroke-width', 2)
      .attr('d', lineH1N1);

    g.append('path')
      .datum(processedData)
      .attr('fill', 'none')
      .attr('stroke', 'var(--color-chart-2)')
      .attr('stroke-width', 2)
      .attr('d', lineH3N2);

    g.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

    g.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));
      
    // Legend
    const legend = svg.append("g")
      .attr("transform", `translate(${margin.left + 20}, ${margin.top})`);

    legend.append("circle").attr("cx",0).attr("cy",0).attr("r", 6).style("fill", "var(--color-chart-1)");
    legend.append("text").attr("x", 10).attr("y", 0).text("H1N1").style("font-size", "12px").attr("alignment-baseline","middle");
    legend.append("circle").attr("cx",0).attr("cy",20).attr("r", 6).style("fill", "var(--color-chart-2)");
    legend.append("text").attr("x", 10).attr("y", 20).text("H3N2").style("font-size", "12px").attr("alignment-baseline","middle");

  }, [processedData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Variant Progression Over Time</CardTitle>
        <CardDescription>Weekly submissions for H1N1 and H3N2 subtypes</CardDescription>
      </CardHeader>
      <CardContent>
        <svg ref={svgRef} className="w-full h-auto" />
      </CardContent>
    </Card>
  );
};

export default VariantProgressionPlot;