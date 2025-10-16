import { useMemo, type ReactNode } from 'react';
import * as topojson from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { GeoJsonProperties } from 'geojson';

import { useFetchData } from '@/hooks/useFetchData';
import { MapDataContext, type MapDataContextType } from './MapDataContext';

type WorldAtlas = Topology<{
  countries: GeometryCollection<GeoJsonProperties>;
}>;

export const MapDataProvider = ({ children }: { children: ReactNode }) => {
  const baseUrl = import.meta.env.BASE_URL;
  const { data: topoJsonData, loading: isLoading } = useFetchData<WorldAtlas>(`${baseUrl}world-110m.json`);

  // useMemo ensures this only runs when the data changes which is never!
  const worldAtlas = useMemo(() => {
    if (!topoJsonData) return null;
    // This is the conversion step from TopoJSON to GeoJSON
    return topojson.feature(topoJsonData, topoJsonData.objects.countries);
  }, [topoJsonData]);

  const value: MapDataContextType = {
    worldAtlas,
    isLoading,
  };

  return (
    <MapDataContext.Provider value={value}>
      {children}
    </MapDataContext.Provider>
  );
};