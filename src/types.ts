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