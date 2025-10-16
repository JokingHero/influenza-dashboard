import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export interface CountryContributionData {
  country: string;
  total: number;
}

interface CountryContributionPlotProps {
  data: CountryContributionData[];
}

const CountryContributionPlot: React.FC<CountryContributionPlotProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 600;
    const margin = { top: 30, right: 30, bottom: 40, left: 150 };

    const y = d3.scaleBand()
      .domain(data.map(d => d.country))
      .range([margin.top, height - margin.bottom])
      .padding(0.2);

    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.total) as number])
      .nice()
      .range([margin.left, width - margin.right]);

    const barColor = 'var(--color-chart-3)';

    svg.attr('viewBox', `0 0 ${width} ${height}`);
    
    const g = svg.append('g');

    const tooltip = d3.select('body').append('div')
      .attr("class", "d3-tooltip")
      .style("position", "absolute").style("visibility", "hidden")
      .style("background", "var(--color-popover)").style("color", "var(--color-popover-foreground)")
      .style("border", "1px solid var(--color-border)").style("padding", "8px")
      .style("border-radius", "var(--radius)").style("pointer-events", "none").style("font-size", "12px");

    g.selectAll('rect')
      .data(data)
      .join('rect')
        .attr('x', margin.left)
        .attr('y', d => y(d.country) as number)
        .attr('width', d => x(d.total) - margin.left)
        .attr('height', y.bandwidth())
        .attr('fill', barColor)
      .on('mouseover', function(_event, d) {
        d3.select(this).style('opacity', 0.8);
        tooltip.style('visibility', 'visible')
          .html(`<strong>${d.country}</strong><br/>Total Submissions: ${d.total.toLocaleString()}`);
      })
      .on('mousemove', (event) => {
        tooltip.style('top', `${event.pageY - 10}px`).style('left', `${event.pageX + 10}px`);
      })
      .on('mouseout', function() {
        d3.select(this).style('opacity', 1);
        tooltip.style('visibility', 'hidden');
      });

    const xAxis = g.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5, 's'));
    xAxis.selectAll('text').style('font-size', '12px');

    const yAxis = g.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y).tickSizeOuter(0));
    yAxis.selectAll('text').style('font-size', '12px');
    
    svg.append('text').attr('text-anchor', 'middle').attr('x', (width + margin.left - margin.right) / 2).attr('y', height - 5)
      .style('font-size', '14px').style('fill', 'var(--color-foreground)').text('Total Submissions');

    return () => { tooltip.remove(); };

  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 20 Country Submissions</CardTitle>
        <CardDescription>Horizontal bar chart showing the total submission volume by country.</CardDescription>
      </CardHeader>
      <CardContent className="px-2">
        {data.length > 0 ? (
          <svg ref={svgRef} className="w-full h-auto" />
        ) : (
          <div className="flex items-center justify-center h-96 text-muted-foreground">
            Processing data...
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CountryContributionPlot;