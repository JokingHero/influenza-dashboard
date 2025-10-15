import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import type { FeatureCollection, GeoJsonProperties } from 'geojson';
import type { Topology, GeometryCollection } from 'topojson-specification';

import { type GeoMapData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type WorldAtlas = Topology<{
  countries: GeometryCollection<GeoJsonProperties>;
}>;

interface GeoMapProps {
  mapData: GeoMapData;
  variantName: string;
}

const GeoMap: React.FC<GeoMapProps> = ({ mapData, variantName }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [world, setWorld] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    fetch('/world-110m.json')
      .then(response => response.json())
      .then((data: WorldAtlas) => {
        const countries = topojson.feature(data, data.objects.countries as GeometryCollection);
        setWorld(countries);
      });
  }, []);

  useEffect(() => {
    if (!svgRef.current || !world || mapData.length === 0) return;

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
      .domain([0, d3.max(mapData, d => d.count) as number])
      .range([2, 20]);

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g');

    // Draw the world map outlines
    g.selectAll('path')
      .data(world.features)
      .join('path')
      .attr('d', pathGenerator)
      .attr('fill', 'var(--color-card)')
      .attr('stroke', 'var(--color-border)');

    // Tooltip for circles
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

    // Draw circles for data points
    g.selectAll('circle')
      .data(mapData.filter(d => d.lat && d.lng))
      .join('circle')
      .attr('cx', d => projection([+d.lng, +d.lat])?.[0] as number)
      .attr('cy', d => projection([+d.lng, +d.lat])?.[1] as number)
      .attr('r', d => radiusScale(d.count))
      .style('fill', 'var(--color-chart-5)')
      .style('opacity', 0.7)
      .attr('stroke', 'var(--color-background)')
      .on("mouseover", (_event, d) => {
        tooltip.style("visibility", "visible")
          .html(`<strong>${d.city}, ${d.country}</strong><br/>Submissions: ${d.count.toLocaleString()}`);
      })
      .on("mousemove", (event) => {
        tooltip.style("top", (event.pageY - 10) + "px")
               .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

    // Cleanup tooltip on component unmount
    return () => {
      tooltip.remove();
    };
  }, [world, mapData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Geographic Distribution ({variantName})</CardTitle>
        <CardDescription>Distribution of variants across the world. Circle size is proportional to submission count.</CardDescription>
      </CardHeader>
      <CardContent>
        <svg ref={svgRef} className="w-full h-auto bg-background" />
      </CardContent>
    </Card>
  );
};

export default GeoMap;