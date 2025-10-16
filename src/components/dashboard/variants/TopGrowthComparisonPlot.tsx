import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { type EmergingVariant, type EmergingVariantCumLoc } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const parseYearWeek = (yearweek: number): Date => {
  const s = yearweek.toString();
  const year = parseInt(s.substring(0, 4));
  const week = parseInt(s.substring(4));
  const d = new Date(year, 0, 1 + (week - 1) * 7);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

interface TopGrowthComparisonPlotProps {
  variants: EmergingVariant[];
}

const TopGrowthComparisonPlot: React.FC<TopGrowthComparisonPlotProps> = ({ variants }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredVariant, setHoveredVariant] = useState<string | null>(null);
  const [hiddenVariants, setHiddenVariants] = useState<Set<string>>(new Set());

  const filteredVariants = useMemo(() => {
      return variants.filter(v => !hiddenVariants.has(v.uniqueId));
  }, [variants, hiddenVariants]);

  const allDates = useMemo(() => {
      return Array.from(new Set(filteredVariants.flatMap(v => v.cumLoc.map(d => d.yearweek))))
        .map(parseYearWeek)
        .sort((a,b) => a.getTime() - b.getTime());
  }, [filteredVariants]);
  
  const maxCount = useMemo(() => {
      return d3.max(filteredVariants, v => d3.max(v.cumLoc, d => d.count)) || 0;
  }, [filteredVariants]);
  
  const colorScale = useMemo(() => d3.scaleOrdinal(d3.schemeTableau10).domain(variants.map(v => v.uniqueId)), [variants]);

  const toggleVariantVisibility = (variantId: string) => {
    setHiddenVariants(prev => {
      const next = new Set(prev);
      if (next.has(variantId)) {
        next.delete(variantId);
      } else {
        next.add(variantId);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!svgRef.current || filteredVariants.length === 0) {
        d3.select(svgRef.current).selectAll('*').remove();
        return;
    };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 500;
    const margin = { top: 20, right: 30, bottom: 90, left: 90 };

    const x = d3.scaleTime()
      .domain(d3.extent(allDates) as [Date, Date])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, maxCount])
      .nice()
      .range([height - margin.bottom, margin.top]);

    svg.attr('viewBox', `0 0 ${width} ${height}`);
    
    const g = svg.append('g');

    const line = d3.line<EmergingVariantCumLoc>()
      .x(d => x(parseYearWeek(d.yearweek)))
      .y(d => y(d.count));

    g.selectAll('.line')
      .data(filteredVariants)
      .join('path')
      .attr('class', 'line')
      .attr('d', d => line(d.cumLoc))
      .attr('fill', 'none')
      .attr('stroke', d => colorScale(d.uniqueId))
      .attr('stroke-width', d => (hoveredVariant === d.uniqueId ? 4 : 2))
      .style('opacity', d => (hoveredVariant && hoveredVariant !== d.uniqueId ? 0.3 : 1))
      .style('transition', 'stroke-width 0.2s, opacity 0.2s');

    const xAxis = g.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(width / 100).tickSizeOuter(0));
    xAxis.selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .style("font-size", "20px")
      .attr('fill', 'var(--color-foreground)');


    const yAxis = g.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y).ticks(5, 's'));
    yAxis.selectAll("text").style("font-size", "20px").attr('fill', 'var(--color-foreground)');
    yAxis.selectAll(".domain, .tick line").attr('stroke', 'var(--color-border)');

    // Y Axis Label
    svg.append("text").attr("text-anchor", "middle").attr("transform", "rotate(-90)")
      .attr("y", 20).attr("x", -(height / 2)).style("font-size", "22px")
      .style("fill", "hsl(var(--foreground))").text("Cumulative Sequence Counts");
      
    // X Axis Label
    svg.append("text").attr("text-anchor", "middle").attr("x", width / 2)
      .attr("y", height - 5).style("font-size", "22px")
      .style("fill", "hsl(var(--foreground))").text("Date");

    // --- Tooltip Logic ---
    const tooltip = d3.select('body').append('div')
        .attr("class", "d3-tooltip")
        .style("position", "absolute").style("visibility", "hidden")
        .style("background", "var(--color-popover)").style("color", "var(--color-popover-foreground)")
        .style("border", "1px solid var(--color-border)").style("padding", "8px")
        .style("border-radius", "var(--radius)").style("pointer-events", "none")
        .style("font-size", "12px").style("z-index", "10").style("max-width", "300px");

    const hoverMarker = g.append('circle').attr('r', 5).attr('fill', 'var(--color-primary)')
        .attr('stroke', 'var(--color-background)').attr('stroke-width', 2).style('visibility', 'hidden');

    const bisectDate = d3.bisector((d: EmergingVariantCumLoc) => parseYearWeek(d.yearweek)).left;

    svg.append('rect')
        .attr('width', width - margin.left - margin.right).attr('height', height - margin.top - margin.bottom)
        .attr('x', margin.left).attr('y', margin.top)
        .attr('fill', 'none').attr('pointer-events', 'all')
        .on('mouseout', () => {
            setHoveredVariant(null);
            tooltip.style('visibility', 'hidden');
            hoverMarker.style('visibility', 'hidden');
        })
        .on('mousemove', (event) => {
            const pointer = d3.pointer(event);
            const xDate = x.invert(pointer[0]);

            let closestVariantData: { variant: EmergingVariant; point: EmergingVariantCumLoc } | null = null;
            let minDistance = Infinity;

            // --- FIX: Use a for...of loop for better type inference ---
            for (const variant of filteredVariants) {
                const i = bisectDate(variant.cumLoc, xDate, 1);
                const d0 = variant.cumLoc[i - 1];
                const d1 = variant.cumLoc[i];
                
                let d: EmergingVariantCumLoc | undefined;
                if (d0 && d1) {
                  d = (xDate.getTime() - parseYearWeek(d0.yearweek).getTime() > parseYearWeek(d1.yearweek).getTime() - xDate.getTime()) ? d1 : d0;
                } else {
                  d = d0 || d1;
                }
                
                if (!d) {
                  continue; // Skip if no valid data point for this variant
                }
                
                const variantY = y(d.count);
                const distance = Math.abs(variantY - pointer[1]);

                if (distance < minDistance) {
                    minDistance = distance;
                    closestVariantData = { variant, point: d };
                }
            }

            // --- TypeScript can now correctly infer the type of closestVariantData here ---
            if (closestVariantData) {
                setHoveredVariant(closestVariantData.variant.uniqueId);
                const { variant, point } = closestVariantData;
                const pointDate = parseYearWeek(point.yearweek);
                
                tooltip.style('visibility', 'visible')
                    .html(`
                        <div class="font-bold text-sm mb-1">${variant.cladeLineage}</div>
                        <div class="text-xs text-muted-foreground mb-1 break-all" style="max-width: 280px; word-wrap: break-word;"><b>Mutations:</b> ${variant.dissimilarityProtmutlist}</div>
                        <div class="text-xs border-t pt-1 mt-1">
                            Date: ${d3.timeFormat('%Y-%m-%d')(pointDate)}<br/>
                            Count: ${point.count.toLocaleString()}
                        </div>
                    `)
                    .style('top', `${event.pageY + 15}px`)
                    .style('left', `${event.pageX + 15}px`);
                
                hoverMarker.style('visibility', 'visible').attr('cx', x(pointDate)).attr('cy', y(point.count));
            }
        });

    return () => { tooltip.remove(); };
  }, [filteredVariants, allDates, maxCount, hoveredVariant, variants, colorScale]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Growth Comparison</CardTitle>
        <CardDescription>Cumulative counts of watchlist variants. Click legend to toggle lines. Hover over chart for details.</CardDescription>
      </CardHeader>
      <CardContent>
        <svg ref={svgRef} className="w-full h-auto" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 text-xs mt-4">
            {variants.map(v => (
                <div key={v.uniqueId} 
                    className="flex items-start gap-2 cursor-pointer" 
                    onClick={() => toggleVariantVisibility(v.uniqueId)}
                    onMouseEnter={() => setHoveredVariant(v.uniqueId)}
                    onMouseLeave={() => setHoveredVariant(null)}
                >
                    <div className="size-3 rounded-sm shrink-0 mt-0.5" style={{ backgroundColor: colorScale(v.uniqueId) }}></div>
                    <div className={cn("transition-opacity flex-1 min-w-0", hiddenVariants.has(v.uniqueId) && "opacity-50 line-through")}>
                        <div className="font-medium truncate" title={v.cladeLineage}>{v.cladeLineage}</div>
                        <div className="text-muted-foreground truncate" title={v.dissimilarityProtmutlist}>{v.dissimilarityProtmutlist}</div>
                    </div>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopGrowthComparisonPlot;