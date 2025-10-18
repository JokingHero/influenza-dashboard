import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { type WeekRegionData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface GlobalMonthlyCountsPlotProps {
  h1n1Data: WeekRegionData;
  h3n2Data: WeekRegionData;
}

interface MonthlyDataPoint {
  month: string;
  h1n1Count: number;
  h3n2Count: number;
  totalCount: number;
}

const GlobalMonthlyCountsPlot: React.FC<GlobalMonthlyCountsPlotProps> = ({ h1n1Data, h3n2Data }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const processedData: MonthlyDataPoint[] = useMemo(() => {
    const monthlyCounts = new Map<string, { h1n1: number; h3n2: number }>();
    h1n1Data.forEach(continent => {
      continent.weeklyData.forEach(week => {
        const d = new Date(week.year, 0, 1 + (parseInt(week.weekNum) - 1) * 7);
        const monthKey = d3.timeFormat('%Y-%m')(d);
        const currentCounts = monthlyCounts.get(monthKey) || { h1n1: 0, h3n2: 0 };
        currentCounts.h1n1 += week.numIsolates;
        monthlyCounts.set(monthKey, currentCounts);
      });
    });
    h3n2Data.forEach(continent => {
      continent.weeklyData.forEach(week => {
        const d = new Date(week.year, 0, 1 + (parseInt(week.weekNum) - 1) * 7);
        const monthKey = d3.timeFormat('%Y-%m')(d);
        const currentCounts = monthlyCounts.get(monthKey) || { h1n1: 0, h3n2: 0 };
        currentCounts.h3n2 += week.numIsolates;
        monthlyCounts.set(monthKey, currentCounts);
      });
    });
    return Array.from(monthlyCounts.entries())
      .map(([month, counts]) => ({
        month,
        h1n1Count: counts.h1n1,
        h3n2Count: counts.h3n2,
        totalCount: counts.h1n1 + counts.h3n2,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [h1n1Data, h3n2Data]);

  useEffect(() => {
    if (!svgRef.current || processedData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 900;
    const height = 500;
    const margin = { top: 30, right: 30, bottom: 90, left: 90 };
    
    const keys = ['h1n1Count', 'h3n2Count'];
    const stack = d3.stack<MonthlyDataPoint>().keys(keys);
    const series = stack(processedData);

    const color = d3.scaleOrdinal<string>()
      .domain(keys)
      .range(['var(--color-chart-1)', 'var(--color-chart-2)']);
      
    const x = d3.scaleBand<string>()
      .domain(processedData.map(d => d.month))
      .range([margin.left, width - margin.right])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(processedData, d => d.totalCount) as number])
      .nice()
      .range([height - margin.bottom, margin.top]);

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const tooltip = d3.select('body').append('div')
      .attr("class", "d3-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "var(--color-popover)")
      .style("color", "var(--color-popover-foreground)")
      .style("border", "1px solid var(--color-border)")
      .style("padding", "8px")
      .style("border-radius", "var(--radius)")
      .style("pointer-events", "none")
      .style("font-size", "12px");

    // --- VISIBLE BARS ---
    const barGroups = svg.append('g')
      .selectAll('g')
      .data(series)
      .join('g')
        .attr('fill', d => color(d.key));

    const bars = barGroups.selectAll('rect')
      .data(d => d)
      .join('rect')
        .attr('x', d => x(d.data.month) as number) 
        .attr('y', d => y(d[1])) 
        .attr('width', x.bandwidth())
        .attr('height', d => y(d[0]) - y(d[1])); 

    // --- HOVER LOGIC ---
    svg.append('g')
      .attr('class', 'hover-layer')
      .selectAll('rect')
      .data(processedData)
      .join('rect')
        .attr('x', d => x(d.month) as number)
        .attr('y', margin.top)
        .attr('width', x.bandwidth())
        .attr('height', height - margin.top - margin.bottom)
        .style('fill', 'transparent')
        .on('mouseover', function(_event, d) {
          bars.filter(barData => barData.data.month === d.month)
            .attr('fill', 'var(--color-primary)');

          tooltip.style('visibility', 'visible');
        })
        .on('mousemove', function (event, d) {
          tooltip
            .html(`
              <div class="font-bold mb-1">${d.month}</div>
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="color:var(--color-chart-1)">●</span> H1N1: <strong>${d.h1n1Count.toLocaleString()}</strong>
              </div>
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="color:var(--color-chart-2)">●</span> H3N2: <strong>${d.h3n2Count.toLocaleString()}</strong>
              </div>
              <div class="mt-1 border-t pt-1">Total: <strong>${d.totalCount.toLocaleString()}</strong></div>
            `)
            .style('top', `${event.pageY - 10}px`)
            .style('left', `${event.pageX + 10}px`);
        })
        .on('mouseout', function () {
          bars.attr('fill', null);
          tooltip.style('visibility', 'hidden');
        });

    // --- AXES and LABELS ---
    const xAxis = svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickValues(x.domain().filter((_d, i) => i % 4 === 0)));
      
    xAxis.selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size", "20px");

    const yAxis = svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5, "s"));
      
    yAxis.selectAll("text").style("font-size", "20px");

    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("y", 20)
      .attr("x", -(height / 2))
      .style("font-size", "22px")
      .style("fill", "var(--color-foreground)")
      .text("Number of Sequences");
      
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height)
      .style("font-size", "22px")
      .style("fill", "var(--color-foreground)")
      .text("Month");

    return () => {
      tooltip.remove();
    };

  }, [processedData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Submissions by Month</CardTitle>
        <CardDescription>
          Total number of H1N1 and H3N2 sequences submitted globally per month. Hover over a bar to highlight the full stack.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <svg ref={svgRef} className="w-full h-auto cursor-pointer" />
      </CardContent>
    </Card>
  );
};

export default GlobalMonthlyCountsPlot;