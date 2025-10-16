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

const getRecencyColor = (dateStr: string): string => {
  const detectionDate = d3.timeParse("%Y%m%d")(dateStr);
  if (!detectionDate) return 'var(--color-muted-foreground)';

  const now = new Date();
  const daysDiff = d3.timeDay.count(detectionDate, now);

  if (daysDiff <= 14) return '#DC267F'; // Bright Red/Pink
  if (daysDiff <= 45) return '#FFB000'; // Yellow
  return 'var(--color-muted-foreground)'; // Grey
};

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
    if (!svgRef.current || !world || mapData.length === 0) {
        d3.select(svgRef.current).selectAll('*').remove(); // Clear SVG if no data
        return;
    };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 960;
    const height = 500;

    const projection = d3.geoMercator()
      .scale(130)
      .center([0, 20])
      .translate([width / 2, height / 2]);

    const pathGenerator = d3.geoPath().projection(projection);

    const radiusScale = d3.scaleSqrt()
      .domain([0, d3.max(mapData, d => d.ct) as number])
      .range([2, 15]);

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g');

    g.selectAll('path')
      .data(world.features)
      .join('path')
      .attr('d', pathGenerator)
      .attr('fill', 'var(--color-card)')
      .attr('stroke', 'var(--color-border)');

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

    g.selectAll('circle')
      .data(mapData)
      .join('circle')
      .attr('cx', d => projection([+d.lng, +d.lat])?.[0] as number)
      .attr('cy', d => projection([+d.lng, +d.lat])?.[1] as number)
      .attr('r', d => radiusScale(d.ct))
      .style('fill', d => getRecencyColor(d.dt))
      .style('opacity', 0.7)
      .attr('stroke', 'var(--color-background)')
      .on("mouseover", (_event, d) => {
        tooltip.style("visibility", "visible")
          .html(`<strong>${d.city}, ${d.ctry}</strong><br/>Count: ${d.ct.toLocaleString()}<br/>Date: ${d.dt}`);
      })
      .on("mousemove", (event) => {
        tooltip.style("top", (event.pageY - 10) + "px")
               .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

    return () => { tooltip.remove(); };
  }, [world, mapData]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Geographic Footprint</CardTitle>
        <CardDescription className="text-xs">Recency-aware map of variant detections.</CardDescription>
      </CardHeader>
      <CardContent className="relative px-0 pb-0">
        <svg ref={svgRef} className="w-full h-auto bg-background" />
         <div className="absolute bottom-2 left-2 flex flex-col items-start gap-1 text-xs bg-background/70 p-2 rounded-md backdrop-blur-sm">
            <div className="flex items-center gap-1.5"><div className="size-3 rounded-full" style={{backgroundColor: '#DC267F'}} /> Last 14 days</div>
            <div className="flex items-center gap-1.5"><div className="size-3 rounded-full" style={{backgroundColor: '#FFB000'}} /> 15-45 days</div>
            <div className="flex items-center gap-1.5"><div className="size-3 rounded-full bg-muted-foreground" /> &gt;45 days</div>
        </div>
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