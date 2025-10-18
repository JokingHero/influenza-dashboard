import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { type WeekRegionData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface VariantProgressionPlotProps {
  h1n1Data: WeekRegionData;
  h3n2Data: WeekRegionData;
}

type ViewType = 'proportions' | 'counts';

interface TimePoint {
  date: Date;
  h1n1Count: number;
  h3n2Count: number;
}

const VariantProgressionPlot: React.FC<VariantProgressionPlotProps> = ({ h1n1Data, h3n2Data }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [processedData, setProcessedData] = useState<TimePoint[]>([]);
  const [view, setView] = useState<ViewType>('proportions');

  useEffect(() => {
    const processData = (data: WeekRegionData): Map<string, number> => {
      const weeklyCounts = new Map<string, number>();
      data.forEach(continent => {
        continent.weeklyData.forEach(week => {
          const key = `${week.year}-W${String(week.weekNum).padStart(2, '0')}`;
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
      const [yearStr, weekStr] = weekKey.split('-W');
      const year = parseInt(yearStr, 10);
      const weekNum = parseInt(weekStr, 10);
      const d = new Date(year, 0, 1 + (weekNum - 1) * 7);

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

    // --- SIZING & MARGINS ---
    const width = 900;
    const height = 500;
    const margin = { top: 40, right: 30, bottom: 90, left: 90 };
    const colors = ['var(--color-chart-1)', 'var(--color-chart-2)'];
    
    // Dynamic Y-axis label based on view
    const yAxisLabel = view === 'counts' ? 'Weekly Sequence Count' : 'Proportion of Submissions';

    const x = d3.scaleTime()
      .domain(d3.extent(processedData, d => d.date) as [Date, Date])
      .range([margin.left, width - margin.right]);

    const g = svg.append('g');
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    if (view === 'counts') {
      const y = d3.scaleLinear()
        .domain([0, d3.max(processedData, d => Math.max(d.h1n1Count, d.h3n2Count)) as number])
        .nice()
        .range([height - margin.bottom, margin.top]);

      const lineH1N1 = d3.line<TimePoint>().x(d => x(d.date)).y(d => y(d.h1n1Count));
      const lineH3N2 = d3.line<TimePoint>().x(d => x(d.date)).y(d => y(d.h3n2Count));

      g.append('path').datum(processedData).attr('fill', 'none').attr('stroke', colors[0]).attr('stroke-width', 2).attr('d', lineH1N1);
      g.append('path').datum(processedData).attr('fill', 'none').attr('stroke', colors[1]).attr('stroke-width', 2).attr('d', lineH3N2);
      
      const yAxis = g.append('g').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(5, 's'));
      yAxis.selectAll("text").style("font-size", "20px");
    
    } else { // Proportions View
        const normalizedData = processedData.map(d => {
            const total = d.h1n1Count + d.h3n2Count;
            return {
                date: d.date,
                h1n1: total > 0 ? d.h1n1Count / total : 0,
                h3n2: total > 0 ? d.h3n2Count / total : 0
            }
        });

        const stack = d3.stack().keys(['h1n1', 'h3n2']);
        const series = stack(normalizedData as any);
        const y = d3.scaleLinear().domain([0, 1]).range([height - margin.bottom, margin.top]);
        
        const area = d3.area<any>()
            .x(d => x(d.data.date))
            .y0(d => y(d[0]))
            .y1(d => y(d[1]));

        g.selectAll('.area').data(series).join('path').attr('class', 'area')
            .attr('d', area).attr('fill', (_d, i) => colors[i]);
        
        const yAxis = g.append('g').attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(5, '.0%'));
        yAxis.selectAll("text").style("font-size", "20px");
    }

    const xAxis = g.append('g').attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(width / 100).tickSizeOuter(0));
    xAxis.selectAll("text").style("font-size", "20px");
      
    const legend = svg.append("g").attr("transform", `translate(${margin.left}, 15)`);
    legend.append("circle").attr("cx",0).attr("cy", 0).attr("r", 15).style("fill", colors[0]);
    legend.append("text").attr("x", 25).attr("y", 0).text("H1N1").style("font-size", "20px").attr("fill", "currentColor").attr("alignment-baseline","middle");
    legend.append("circle").attr("cx", 100).attr("cy", 0).attr("r", 15).style("fill", colors[1]);
    legend.append("text").attr("x", 125).attr("y", 0).text("H3N2").style("font-size", "20px").attr("fill", "currentColor").attr("alignment-baseline","middle");

    // Y Axis Label
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("y", 20)
      .attr("x", -(height / 2))
      .style("font-size", "22px")
      .style("fill", "var(--color-foreground)")
      .text(yAxisLabel);
      
    // X Axis Label
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height - 25)
      .style("font-size", "22px")
      .style("fill", "var(--color-foreground)")
      .text("Date");

  }, [processedData, view]);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Weekly Variant Progression Over Time</CardTitle>
          <CardDescription>
            {view === 'counts' 
              ? 'Weekly counts for H1N1 and H3N2.' 
              : 'Weekly proportion of H1N1 vs. H3N2.'
            }
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <CardAction className="flex justify-end">
          <ToggleGroup type="single" value={view} onValueChange={(value: ViewType) => value && setView(value)} size="sm">
            <ToggleGroupItem value="proportions">Proportions</ToggleGroupItem>
            <ToggleGroupItem value="counts">Raw Counts</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
        <svg ref={svgRef} className="w-full h-auto" />
      </CardContent>
    </Card>
  );
};

export default VariantProgressionPlot;