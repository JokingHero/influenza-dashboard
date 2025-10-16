import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { type EmergingVariant } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ContinentalTrendPlotProps {
  variant: EmergingVariant | null;
}

const abbreviateContinent = (name: string): string => {
  switch (name) {
    case 'NorthAmerica':
      return 'N. America';
    case 'SouthAmerica':
      return 'S. America';
    default:
      return name;
  }
};

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
    
    const continentOrder = ["NorthAmerica", "Africa", "Europe", "Oceania", "Asia", "SouthAmerica"];

    const sortedData = [...processedData].sort((a, b) => {
        const indexA = continentOrder.indexOf(a.continent);
        const indexB = continentOrder.indexOf(b.continent);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    const width = 800;
    const height = 400;
    const margin = { top: 40, right: 120, bottom: 70, left: 90 };

    const abbreviatedContinents = sortedData.map(d => abbreviateContinent(d.continent));
    const months = Array.from(new Set(sortedData.flatMap(d => d.monthlydata.map(md => md.date))))
      .sort((a, b) => a.localeCompare(b));

    const x0 = d3.scaleBand<string>()
      .domain(abbreviatedContinents)
      .range([margin.left, width - margin.right])
      .padding(0.2);

    const x1 = d3.scaleBand<string>()
      .domain(months)
      .range([0, x0.bandwidth()])
      .padding(0.05);

    const y = d3.scaleLinear()
      .domain([0, 100])
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
      .data(sortedData)
      .join("g")
      .attr("class", "continent-group")
      .attr("transform", d => `translate(${x0(abbreviateContinent(d.continent))}, 0)`);

    const parseMonth = d3.timeParse("%Y%m");
    const formatTooltipMonth = d3.timeFormat("%B %Y");

    continentGroups.selectAll("rect")
      .data(d => d.monthlydata)
      .join("rect")
        .attr("x", d => x1(d.date) as number)
        .attr("y", d => y(d.count))
        .attr("width", x1.bandwidth())
        .attr("height", d => y(0) - y(d.count))
        .attr("fill", d => color(d.date))
      .on("mouseover", (_event, d) => {
        const dateObj = parseMonth(d.date);
        tooltip.style("visibility", "visible")
          .html(`<strong>Month:</strong> ${dateObj ? formatTooltipMonth(dateObj) : d.date}<br/><strong>Prevalence:</strong> ${d.count.toFixed(1)}%`);
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
    
    xAxis.selectAll("text")
      .style("font-size", "20px")
      .attr('fill', 'var(--color-foreground)')
      .style("text-anchor", "middle");
    xAxis.selectAll(".domain, .tick line").attr('stroke', 'var(--color-border)');

    const yAxis = g.append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`));

    yAxis.selectAll("text").style("font-size", "20px").attr('fill', 'var(--color-foreground)');
    yAxis.selectAll(".domain, .tick line").attr('stroke', 'var(--color-border)');

    // Y-axis Label
    svg.append("text").attr("transform", "rotate(-90)").attr("y", 15).attr("x", 0 - (height / 2))
        .style("text-anchor", "middle").style("font-size", "22px")
        .attr("fill", "var(--color-foreground)").text("Monthly Prevalence (%)");

    // X Axis Label
    svg.append("text").attr("text-anchor", "middle").attr("x", width / 2).attr("y", height - 5)
        .style("font-size", "22px").attr("fill", "var(--color-foreground)").text("Continent");

    const legend = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 20)
      .attr("text-anchor", "start")
      .selectAll("g")
      .data(months)
      .join("g")
      .attr("transform", (_d, i) => `translate(${width - margin.right + 10}, ${margin.top + i * 30})`);
    
    const formatLegendMonth = d3.timeFormat("%b '%y");

    legend.append("rect")
      .attr("x", 0)
      .attr("width", 25)
      .attr("height", 25)
      .attr("fill", color);

    legend.append("text")
      .attr("x", 30)
      .attr("y", 12.5)
      .attr("dy", "0.35em")
      .attr('fill', 'var(--color-foreground)')
      .text(d => {
        const dateObj = parseMonth(d);
        return dateObj ? formatLegendMonth(dateObj) : d;
      });

    return () => { tooltip.remove(); };
  }, [processedData]);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Continental Trend</CardTitle>
        <CardDescription>
          Monthly prevalence of the variant by continent. Data reflects the most recent 3 months available.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2">
        <svg ref={svgRef} className="w-full h-auto" />
      </CardContent>
    </Card>
  );
};

export default ContinentalTrendPlot;