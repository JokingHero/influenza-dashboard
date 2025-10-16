import { useState, useEffect } from 'react';
import { type WeekRegionData, type CountryCountTotal, type GeoMapData } from '@/types';

interface GlobalData {
    h1n1Weekly: WeekRegionData;
    h3n2Weekly: WeekRegionData;
    h1n1Totals: CountryCountTotal;
    h3n2Totals: CountryCountTotal;
    h1n1MapData: GeoMapData;
    h3n2MapData: GeoMapData;
}

export function useGlobalData() {
  const [data, setData] = useState<GlobalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responses = await Promise.all([
          fetch('/variant-tracker/weekRegion2perc_h1n1.json'),
          fetch('/variant-tracker/weekRegion2perc_h3n2.json'),
          fetch('/variant-tracker/countryCountTotal_h1n1.json'),
          fetch('/variant-tracker/countryCountTotal_h3n2.json'),
          fetch('/variant-tracker/map_h1n1.json'),
          fetch('/variant-tracker/map_h3n2.json'),
        ]);

        for (const res of responses) {
            if (!res.ok) throw new Error(`Failed to fetch ${res.url}`);
        }

        const [
            h1n1WeeklyData, h3n2WeeklyData,
            h1n1TotalsData, h3n2TotalsData,
            h1n1MapRawData, h3n2MapRawData,
        ] = await Promise.all(responses.map(res => res.json()));

        const isValidWeeklyData = (d: unknown): d is WeekRegionData => Array.isArray(d) && d.length > 0;
        
        setData({
            h1n1Weekly: isValidWeeklyData(h1n1WeeklyData) ? h1n1WeeklyData : [],
            h3n2Weekly: isValidWeeklyData(h3n2WeeklyData) ? h3n2WeeklyData : [],
            h1n1Totals: h1n1TotalsData?.[0] || null,
            h3n2Totals: h3n2TotalsData?.[0] || null,
            h1n1MapData: Array.isArray(h1n1MapRawData) ? h1n1MapRawData : [],
            h3n2MapData: Array.isArray(h3n2MapRawData) ? h3n2MapRawData : [],
        });

      } catch (err) {
        console.error("Failed to fetch global data:", err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  return { data, loading, error };
}