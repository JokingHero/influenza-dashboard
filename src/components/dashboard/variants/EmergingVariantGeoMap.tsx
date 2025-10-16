import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import type { FeatureCollection, GeoJsonProperties } from 'geojson';
import type { Topology, GeometryCollection } from 'topojson-specification';
import { type EmergingVariant } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type WorldAtlas = Topology<{
  countries: GeometryCollection<GeoJsonProperties>;
}>;

interface EmergingVariantGeoMapProps {
  variant: EmergingVariant | null;
}

const EmergingVariantGeoMap: React.FC<EmergingVariantGeoMapProps> = ({ variant }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [world, setWorld] = useState<FeatureCollection | null>(null);

  const mapData = useMemo(() => {
    if (!variant) return [];
    return variant.map.filter(d => d.lat && d.lng);
  }, [variant]);

  useEffect(() => {
    fetch('/world-110m.json')
      .then(response => response.json())
      .then((data: WorldAtlas) => {
        const countries = topojson.feature(data, data.objects.countries as GeometryCollection);
        setWorld(countries);
      });
  }, []);

  useEffect(() => {
    if (!svgRef.current || !world) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 960;
    const height = 500;

    const projection = d3.geoMercator()
      .scale(130)
      .center([0, 20])
      .translate([width / 2, height / 2]);

    const pathGenerator = d3.geoPath().projection(projection);

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g');

    // Draw base map with styles matching GlobalGeoMap
    g.selectAll('path')
      .data(world.features)
      .join('path')
      .attr('d', pathGenerator)
      .attr('fill', 'var(--color-muted-foreground-light)')
      .attr('stroke', 'var(--color-background)')
      .attr('stroke-width', 0.5);

    // If there's no data, we stop after drawing the base map.
    if (mapData.length === 0) {
        return;
    };
    
    // --- Scales for data points ---
    const radiusScale = d3.scaleSqrt()
      .domain([0, d3.max(mapData, d => d.ct) as number])
      .range([2.5, 20]);
      
    const parseDate = d3.timeParse("%Y%m%d");
    const dates = mapData.map(d => parseDate(d.dt)).filter(d => d !== null) as Date[];
    const dateExtent = d3.extent(dates) as [Date, Date];

    // Create a continuous color scale from light yellow to bright red
    const colorInterpolator = d3.interpolate('hsl(60, 80%, 70%)', 'hsl(0, 90%, 55%)');
    const colorScale = d3.scaleSequential(colorInterpolator).domain(dateExtent);

    // --- Tooltip ---
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

    // --- Draw Circles ---
    g.selectAll('circle')
      .data(mapData)
      .join('circle')
      .attr('cx', d => projection([+d.lng, +d.lat])?.[0] as number)
      .attr('cy', d => projection([+d.lng, +d.lat])?.[1] as number)
      .attr('r', d => radiusScale(d.ct))
      .style('fill', d => {
          const date = parseDate(d.dt);
          return date ? colorScale(date) : 'var(--color-muted-foreground)';
      })
      .style('opacity', 0.8)
      .attr('stroke', 'var(--color-background)')
      .attr('stroke-width', 0.5)
      .on("mouseover", (_event, d) => {
        const dateObj = parseDate(d.dt);
        tooltip.style("visibility", "visible")
          .html(`<strong>${d.city}, ${d.ctry}</strong><br/>Count: ${d.ct.toLocaleString()}<br/>Date: ${dateObj ? d3.timeFormat('%Y-%m-%d')(dateObj) : d.dt}`);
      })
      .on("mousemove", (event) => {
        tooltip.style("top", (event.pageY - 10) + "px")
               .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

    // --- Continuous Color Legend ---
    const legendWidth = 150;
    const legendHeight = 8;
    const legendGroup = svg.append('g').attr('transform', `translate(20, ${height - 40})`);

    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
        .attr('id', 'recency-gradient')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '100%').attr('y2', '0%');

    // Create gradient stops from the interpolator
    gradient.selectAll("stop")
        .data(d3.range(0, 1.01, 0.25).map(t => ({ offset: `${t*100}%`, color: colorInterpolator(t) })))
        .join("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);
    
    legendGroup.append('rect')
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .style('fill', 'url(#recency-gradient)');
    
    legendGroup.append('text')
        .attr('x', 0)
        .attr('y', legendHeight + 15)
        .text('Older')
        .attr('fill', 'var(--color-foreground)')
        .style('font-size', '12px')
        .style('text-anchor', 'start');

    legendGroup.append('text')
        .attr('x', legendWidth)
        .attr('y', legendHeight + 15)
        .text('Recent')
        .attr('fill', 'var(--color-foreground)')
        .style('font-size', '12px')
        .style('text-anchor', 'end');


    return () => { tooltip.remove(); };
  }, [world, mapData]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Geographic Footprint</CardTitle>
        <CardDescription className="text-xs">Recency-aware map of variant detections. Circle color indicates recency, size indicates count.</CardDescription>
      </CardHeader>
      <CardContent className="relative px-0 pb-0">
        <svg ref={svgRef} className="w-full h-auto bg-background" />
        {mapData.length === 0 && (
             <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                No geographic data for this variant.
            </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmergingVariantGeoMap;