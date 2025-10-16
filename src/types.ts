export interface WeeklyData {
  year: number;
  weekNum: string;
  numCountries: number;
  numUKVUI: number;
  numIsolates: number;
  numIsolates_4wk: number;
  percOfUKVUI: number;
  percOfUKVUI_2wkavg: number;
  percOfUKVUI_3wkavg: number;
  percOfUKVUI_4wkavg: number;
  expSmoothingPerc: number;
}

export interface ContinentData {
  continent: string;
  numCountriesInContinent: number;
  weeklyData: WeeklyData[];
}

export type WeekRegionData = ContinentData[];

export interface MapDataPoint {
  city: string;
  country: string;
  lat: string;
  lng: string;
  count: number;
}

export type GeoMapData = MapDataPoint[];

export interface CountryCountTotal {
  totalNumIsolates: number;
  totalNumCountries: number;
  utcTimestamp: string;
}

// --- Emerging Variants ---

export interface EmergingVariantMapPoint {
  city: string;
  ctry: string;
  dt: string; // YYYYMMDD
  lat: string;
  lng: string;
  ct: number;
}

export interface EmergingVariantContinentData {
  continent: string;
  monthlydata: {
    date: string; // YYYYMM
    count: number;
  }[];
}

export interface EmergingVariantCumLoc {
  yearweek: number; // YYYYWW
  count: number;
}

export interface EmergingVariant {
  uniqueId: string;
  variant: string;
  cladeLineage: string;
  count: number;
  currRanking: number;
  dissimilarityProtmutlist: string;
  average_antigenic_distance: string;
  cumLoc: EmergingVariantCumLoc[];
  continents: EmergingVariantContinentData[];
  map: EmergingVariantMapPoint[];
  // Merged fields
  prevRanking?: number;
  // Calculated fields
  weeklyGrowthRate?: number;
}

export interface EmergingVariantRiser {
  variant: string;
  cladeLineage: string;
  currRanking: number;
  prevRanking: number;
  topRankingRiserScore: number;
}