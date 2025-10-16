import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { type EmergingVariant } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ContinentalTrendPlotProps {
  variant: EmergingVariant | null;
}

const ContinentalTrendPlot: React.FC<ContinentalTrendPlotProps> = ({ variant }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const processedData = useMemo(() => {
    if (!variant) return [];
    return variant.continents;
  }, [variant]);

  useEffect(() => {
    if (!svgRef.current || !processedData || processedData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 400;
    const margin = { top: 40, right: 20, bottom: 40, left: 50 };

    const continents = processedData.map(d => d.continent);
    const months = Array.from(new Set(processedData.flatMap(d => d.monthlydata.map(md => md.date))))
      .sort((a, b) => a.localeCompare(b));

    const x0 = d3.scaleBand<string>()
      .domain(continents)
      .range([margin.left, width - margin.right])
      .padding(0.2);

    const x1 = d3.scaleBand<string>()
      .domain(months)
      .range([0, x0.bandwidth()])
      .padding(0.05);

    const y = d3.scaleLinear()
      .domain([0, d3.max(processedData, d => d3.max(d.monthlydata, md => md.count)) as number])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal<string>()
      .domain(months)
      .range(['var(--color-chart-3)', 'var(--color-chart-4)', 'var(--color-chart-5)']);

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g');

    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "var(--color-popover)")
      .style("color", "var(--color-popover-foreground)")
      .style("border", "1px solid var(--color-border)")
      .style("padding", "8px")
      .style("border-radius", "var(--radius)")
      .style("pointer-events", "none")
      .style("font-size", "12px");

    const continentGroups = g.selectAll(".continent-group")
      .data(processedData)
      .join("g")
      .attr("class", "continent-group")
      .attr("transform", d => `translate(${x0(d.continent)}, 0)`);

    continentGroups.selectAll("rect")
      .data(d => d.monthlydata)
      .join("rect")
        .attr("x", d => x1(d.date) as number)
        .attr("y", d => y(d.count))
        .attr("width", x1.bandwidth())
        .attr("height", d => y(0) - y(d.count))
        .attr("fill", d => color(d.date))
      .on("mouseover", (event, d) => {
        tooltip.style("visibility", "visible")
          .html(`<strong>Month:</strong> ${d.date}<br/><strong>Prevalence:</strong> ${d.count.toFixed(2)}`);
      })
      .on("mousemove", (event) => {
        tooltip.style("top", (event.pageY - 10) + "px")
               .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

    const xAxis = g.append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x0).tickSizeOuter(0));
    
    xAxis.selectAll("text").style("font-size", "12px").attr('fill', 'var(--color-foreground)');
    xAxis.selectAll(".domain, .tick line").attr('stroke', 'var(--color-border)');

    const yAxis = g.append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y).ticks(5, "s"));

    yAxis.selectAll("text").style("font-size", "12px").attr('fill', 'var(--color-foreground)');
    yAxis.selectAll(".domain, .tick line").attr('stroke', 'var(--color-border)');

    const legend = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "start")
      .selectAll("g")
      .data(months)
      .join("g")
      .attr("transform", (d, i) => `translate(${width - margin.right - 100}, ${margin.top + i * 20})`);

    legend.append("rect")
      .attr("x", 0)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", color);

    legend.append("text")
      .attr("x", 24)
      .attr("y", 9.5)
      .attr("dy", "0.35em")
      .attr('fill', 'var(--color-foreground)')
      .text(d => d);

    return () => { tooltip.remove(); };
  }, [processedData]);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Continental Trend</CardTitle>
        <CardDescription className="text-xs">Prevalence by continent for the last 3 months.</CardDescription>
      </CardHeader>
      <CardContent className="px-2">
        <svg ref={svgRef} className="w-full h-auto" />
      </CardContent>
    </Card>
  );
};

export default ContinentalTrendPlot;