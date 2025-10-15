import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import type { FeatureCollection, GeoJsonProperties } from 'geojson';
import type { Topology, GeometryCollection } from 'topojson-specification';
import { type GeoMapData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type WorldAtlas = Topology<{ countries: GeometryCollection<GeoJsonProperties> }>;

interface GlobalGeoMapProps {
  h1n1MapData: GeoMapData;
  h3n2MapData: GeoMapData;
}

const GlobalGeoMap: React.FC<GlobalGeoMapProps> = ({ h1n1MapData, h3n2MapData }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [world, setWorld] = useState<FeatureCollection | null>(null);

  const aggregatedData = useMemo(() => {
    const countryData = new Map<string, { h1n1: number; h3n2: number; locations: { lat: number; lng: number; count: number }[] }>();

    h1n1MapData.forEach(d => {
      const entry = countryData.get(d.country) || { h1n1: 0, h3n2: 0, locations: [] };
      entry.h1n1 += d.count;
      entry.locations.push({ lat: +d.lat, lng: +d.lng, count: d.count });
      countryData.set(d.country, entry);
    });

    h3n2MapData.forEach(d => {
      const entry = countryData.get(d.country) || { h1n1: 0, h3n2: 0, locations: [] };
      entry.h3n2 += d.count;
      if (!entry.locations.some(loc => loc.lat === +d.lat && loc.lng === +d.lng)) {
        entry.locations.push({ lat: +d.lat, lng: +d.lng, count: d.count });
      }
      countryData.set(d.country, entry);
    });

    return Array.from(countryData.entries()).map(([country, data]) => {
      const total = data.h1n1 + data.h3n2;
      const primaryLocation = data.locations.reduce((max, loc) => loc.count > max.count ? loc : max, { lat: 0, lng: 0, count: -1 });
      return { country, ...data, total, lat: primaryLocation.lat, lng: primaryLocation.lng };
    });
  }, [h1n1MapData, h3n2MapData]);

  useEffect(() => {
    fetch('/world-110m.json')
      .then(response => response.json())
      .then((data: WorldAtlas) => {
        const countries = topojson.feature(data, data.objects.countries as GeometryCollection);
        setWorld(countries);
      });
  }, []);

  useEffect(() => {
    if (!svgRef.current || !world || aggregatedData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 960;
    const height = 500;

    const projection = d3.geoMercator().scale(130).center([0, 20]).translate([width / 2, height / 2]);
    const pathGenerator = d3.geoPath().projection(projection);

    const maxCount = d3.max(aggregatedData, d => d.total) || 1;
    const radiusScale = d3.scaleSqrt().domain([0, maxCount]).range([2, 25]);

    const getColor = (d: typeof aggregatedData[0]) => {
      if (d.total === 0) return 'var(--color-muted-foreground)';
      const h1n1Perc = d.h1n1 / d.total;
      if (h1n1Perc > 0.6) return 'var(--color-chart-1)'; // H1N1
      if (h1n1Perc < 0.4) return 'var(--color-chart-2)'; // H3N2
      return 'var(--color-muted-foreground)'; // Mixed
    };

    svg.attr('viewBox', `0 0 ${width} ${height}`);
    const g = svg.append('g');

    g.selectAll('path').data(world.features).join('path')
      .attr('d', pathGenerator).attr('fill', 'var(--color-card)').attr('stroke', 'var(--color-border)');

    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip").style("position", "absolute").style("visibility", "hidden")
      .style("background", "var(--color-popover)").style("color", "var(--color-popover-foreground)")
      .style("border", "1px solid var(--color-border)").style("padding", "8px")
      .style("border-radius", "var(--radius)").style("pointer-events", "none").style("font-size", "12px");

    g.selectAll('circle')
      .data(aggregatedData.filter(d => d.lat && d.lng && d.total > 0).sort((a, b) => b.total - a.total))
      .join('circle')
      .attr('cx', d => projection([d.lng, d.lat])?.[0] as number)
      .attr('cy', d => projection([d.lng, d.lat])?.[1] as number)
      .attr('r', d => radiusScale(d.total))
      .style('fill', getColor)
      .style('opacity', 0.7)
      .attr('stroke', 'var(--color-background)')
      .on("mouseover", (_event, d) => {
        tooltip.style("visibility", "visible")
          .html(`<strong>${d.country}</strong><br/>
                 <span style="color:var(--color-chart-1)">●</span> H1N1: ${d.h1n1.toLocaleString()}<br/>
                 <span style="color:var(--color-chart-2)">●</span> H3N2: ${d.h3n2.toLocaleString()}`);
      })
      .on("mousemove", (event) => {
        tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

    return () => { tooltip.remove(); };
  }, [world, aggregatedData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Geographic Distribution</CardTitle>
        <CardDescription>Bubble size indicates total submissions. Color shows dominant subtype (&gt;60%).</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <svg ref={svgRef} className="w-full h-auto bg-background" />
          <div className="absolute bottom-2 left-2 flex items-center gap-4 text-xs bg-background/70 p-2 rounded-md backdrop-blur-sm">
            <div className="flex items-center gap-1.5"><div className="size-3 rounded-full" style={{backgroundColor: 'var(--color-chart-1)'}} /> H1N1 Dominant</div>
            <div className="flex items-center gap-1.5"><div className="size-3 rounded-full" style={{backgroundColor: 'var(--color-chart-2)'}} /> H3N2 Dominant</div>
            <div className="flex items-center gap-1.5"><div className="size-3 rounded-full bg-muted-foreground" /> Mixed</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GlobalGeoMap;