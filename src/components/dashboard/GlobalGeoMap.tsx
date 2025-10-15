import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import type { Feature, FeatureCollection, GeoJsonProperties } from 'geojson';
import type { Topology, GeometryCollection } from 'topojson-specification';
import { type GeoMapData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Import the Download icon
import { Plus, Minus, RefreshCcw, Download } from 'lucide-react';

type WorldAtlas = Topology<{ countries: GeometryCollection<GeoJsonProperties> }>;

interface AggregatedCountryData {
  country: string;
  h1n1: number;
  h3n2: number;
  total: number;
  h1n1Perc: number;
}

interface GlobalGeoMapProps {
  h1n1MapData: GeoMapData;
  h3n2MapData: GeoMapData;
}

// Helper function to determine color based on discrete categories
const getColorForCountry = (data: AggregatedCountryData | undefined): string => {
  if (!data || data.total === 0) {
    return 'var(--color-muted-foreground-light)'; // No data or zero submissions
  }
  // H1N1 is dominant if it's over 60%
  if (data.h1n1Perc > 0.6) {
    return 'var(--color-chart-1)'; // H1N1 Dominant
  }
  // H3N2 is dominant if H1N1 is under 40%
  if (data.h1n1Perc < 0.4) {
    return 'var(--color-chart-2)'; // H3N2 Dominant
  }
  // Otherwise, it's mixed
  return 'var(--color-chart-3)'; // Mixed
};


const countryNameMapping: { [key: string]: string } = {
  "United States": "United States of America",
  "Russian Federation": "Russia",
  "Cote d'Ivoire": "Côte d'Ivoire",
};


const GlobalGeoMap: React.FC<GlobalGeoMapProps> = ({ h1n1MapData, h3n2MapData }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomBehavior = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [world, setWorld] = useState<FeatureCollection | null>(null);

  const aggregatedDataByCountry = useMemo(() => {
    const countryData = new Map<string, { h1n1: number; h3n2: number }>();

    // Helper function to get the correct country name
    const getMappedCountryName = (name: string) => countryNameMapping[name] || name;

    h1n1MapData.forEach(d => {
      // 2. Use the mapped name for aggregation
      const mappedName = getMappedCountryName(d.country);
      const entry = countryData.get(mappedName) || { h1n1: 0, h3n2: 0 };
      entry.h1n1 += d.count;
      countryData.set(mappedName, entry);
    });

    h3n2MapData.forEach(d => {
      // 2. Use the mapped name for aggregation
      const mappedName = getMappedCountryName(d.country);
      const entry = countryData.get(mappedName) || { h1n1: 0, h3n2: 0 };
      entry.h3n2 += d.count;
      countryData.set(mappedName, entry);
    });

    const dataMap = new Map<string, AggregatedCountryData>();
    countryData.forEach((data, country) => {
      const total = data.h1n1 + data.h3n2;
      dataMap.set(country, {
        country,
        ...data,
        total,
        h1n1Perc: total > 0 ? data.h1n1 / total : 0,
      });
    });

    return dataMap;
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
    if (!svgRef.current || !world) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 960;
    const height = 500;

    const projection = d3.geoMercator().scale(130).center([0, 20]).translate([width / 2, height / 2]);
    const pathGenerator = d3.geoPath().projection(projection);

    svg.attr('viewBox', `0 0 ${width} ${height}`);
    const g = svg.append('g');

    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip").style("position", "absolute").style("visibility", "hidden")
      .style("background", "var(--color-popover)").style("color", "var(--color-popover-foreground)")
      .style("border", "1px solid var(--color-border)").style("padding", "8px")
      .style("border-radius", "var(--radius)").style("pointer-events", "none").style("font-size", "12px");

    // Draw countries
    g.selectAll('path')
      .data(world.features)
      .join('path')
      .attr('d', pathGenerator)
      .attr('fill', d => {
        const countryName = (d.properties as { name: string }).name;
        const countryData = aggregatedDataByCountry.get(countryName);
        return getColorForCountry(countryData);
      })
      .attr('stroke', 'var(--color-background)')
      .attr('stroke-width', 0.5)
      .on("mouseover", (event, d: Feature<any, any>) => {
        const countryName = d.properties.name;
        const countryData = aggregatedDataByCountry.get(countryName);
        d3.select(event.currentTarget).style('opacity', 0.7);
        tooltip.style("visibility", "visible");
        if (countryData && countryData.total > 0) {
          tooltip.html(`<strong>${countryData.country}</strong><br/>
                   <span style="color:var(--color-chart-1)">●</span> H1N1: ${countryData.h1n1.toLocaleString()}<br/>
                   <span style="color:var(--color-chart-2)">●</span> H3N2: ${countryData.h3n2.toLocaleString()}<br/>
                   Total: ${countryData.total.toLocaleString()}`);
        } else {
          tooltip.html(`<strong>${countryName}</strong><br/>No data available`);
        }
      })
      .on("mousemove", (event) => {
        tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget).style('opacity', 1);
        tooltip.style("visibility", "hidden");
      });

    // Zoom functionality
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
      });
    
    svg.call(zoom);
    zoomBehavior.current = zoom; // Save zoom behavior to ref for button handlers

    return () => { tooltip.remove(); };
  }, [world, aggregatedDataByCountry]);

  const handleZoomIn = () => {
    if (svgRef.current && zoomBehavior.current) {
      d3.select(svgRef.current).transition().duration(250).call(zoomBehavior.current.scaleBy, 1.2);
    }
  };
  const handleZoomOut = () => {
    if (svgRef.current && zoomBehavior.current) {
      d3.select(svgRef.current).transition().duration(250).call(zoomBehavior.current.scaleBy, 0.8);
    }
  };
  const handleZoomReset = () => {
    if (svgRef.current && zoomBehavior.current) {
      d3.select(svgRef.current).transition().duration(250).call(zoomBehavior.current.transform, d3.zoomIdentity);
    }
  };

  const handleDownloadSVG = () => {
    if (!svgRef.current) return;

    // 1. Create a clone of the SVG node to avoid modifying the live one.
    const svgNode = svgRef.current.cloneNode(true) as SVGSVGElement;

    // 2. To ensure colors work in the downloaded file, we must embed the CSS variables.
    //    We get the computed styles from the document and create a <style> block.
    const cssVars = ['--color-card', '--color-chart-1', '--color-chart-2', 
      '--color-chart-3', '--color-muted-foreground-light', '--color-background'];
    const computedStyles = getComputedStyle(document.documentElement);
    let styleContent = ':root {';
    cssVars.forEach(v => {
      styleContent += `${v}: ${computedStyles.getPropertyValue(v)};`;
    });
    styleContent += '}';
    
    const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleEl.textContent = styleContent;
    svgNode.prepend(styleEl);
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgNode);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'global-influenza-map.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Geographic Distribution</CardTitle>
        <CardDescription>Country color indicates dominant subtype (&gt;60% of submissions). Grey indicates no data. Use scroll or buttons to zoom.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <svg ref={svgRef} className="w-full h-auto bg-background cursor-grab active:cursor-grabbing" />
          
          <div className="absolute top-2 right-2 flex flex-col gap-1.5">
            <Button onClick={handleZoomIn} variant="outline" size="icon-sm" aria-label="Zoom in">
              <Plus className="size-4" />
            </Button>
            <Button onClick={handleZoomOut} variant="outline" size="icon-sm" aria-label="Zoom out">
              <Minus className="size-4" />
            </Button>
            <Button onClick={handleZoomReset} variant="outline" size="icon-sm" aria-label="Reset zoom">
                <RefreshCcw className="size-4" />
            </Button>
            <Button onClick={handleDownloadSVG} variant="outline" size="icon-sm" aria-label="Download SVG">
              <Download className="size-4" />
            </Button>
          </div>

          <div className="absolute bottom-2 left-2 flex items-center gap-4 text-xs bg-background/70 p-2 rounded-md backdrop-blur-sm">
            <div className="flex items-center gap-1.5"><div className="size-3 rounded-full" style={{backgroundColor: 'var(--color-chart-2)'}} /> H3N2 dominated</div>
            <div className="flex items-center gap-1.5"><div className="size-3 rounded-full" style={{backgroundColor: 'var(--color-chart-3)'}} /> Mixed </div>
            <div className="flex items-center gap-1.5"><div className="size-3 rounded-full" style={{backgroundColor: 'var(--color-chart-1)'}} /> H1N1 dominated</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GlobalGeoMap;