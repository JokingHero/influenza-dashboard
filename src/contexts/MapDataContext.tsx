import { createContext, useContext } from 'react';
import type { FeatureCollection } from 'geojson';

export interface MapDataContextType {
  worldAtlas: FeatureCollection | null;
  isLoading: boolean;
}

export const MapDataContext = createContext<MapDataContextType | undefined>(undefined);

export const useMapData = () => {
  const context = useContext(MapDataContext);
  if (context === undefined) {
    throw new Error('useMapData must be used within a MapDataProvider');
  }
  return context;
};