import { useMemo } from 'react';
import * as d3 from 'd3';
// FIX: Import timeParse along with timeFormat
import { timeFormat, timeParse } from 'd3-time-format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VariantProgressionPlot from '../VariantProgressionPlot';
import { type WeekRegionData, type CountryCountTotal, type GeoMapData } from '@/types';
import { Database, Globe, CalendarDays, BarChart4 } from 'lucide-react';
import GlobalGeoMap from '../GlobalGeoMap';
import GlobalMonthlyCountsPlot from '../GlobalMonthlyCountsPlot';
import PlaceholderCard from '../PlaceholderCard';


interface GlobalSituationReportProps {
  h1n1Data: WeekRegionData;
  h3n2Data: WeekRegionData;
  h1n1Totals: CountryCountTotal;
  h3n2Totals: CountryCountTotal;
  h1n1MapData: GeoMapData;
  h3n2MapData: GeoMapData;
}

const GlobalSituationReport: React.FC<GlobalSituationReportProps> = ({ h1n1Data, h3n2Data, h1n1Totals, h3n2Totals, h1n1MapData, h3n2MapData }) => {
  const kpiData = useMemo(() => {
    // KPI 1-3 calculations (no changes here)...
    const totalSequences = h1n1Totals.totalNumIsolates + h3n2Totals.totalNumIsolates;
    const totalCountries = h1n1Totals.totalNumCountries + h3n2Totals.totalNumCountries;

    const allWeeklyData = [
      ...h1n1Data.flatMap(c => c.weeklyData.map(w => ({ ...w, variant: 'h1n1' }))),
      ...h3n2Data.flatMap(c => c.weeklyData.map(w => ({ ...w, variant: 'h3n2' })))
    ];
    const weeklyTotals = d3.rollup(allWeeklyData, v => d3.sum(v, d => d.numIsolates), d => `${d.year}-W${String(d.weekNum).padStart(2, '0')}`, d => d.variant);
    const sortedWeeks = Array.from(weeklyTotals.keys()).sort().reverse();
    const last4Weeks = sortedWeeks.slice(0, 4);
    let h1n1Last4Wks = 0;
    let h3n2Last4Wks = 0;
    last4Weeks.forEach(weekKey => {
      const weekData = weeklyTotals.get(weekKey);
      h1n1Last4Wks += weekData?.get('h1n1') || 0;
      h3n2Last4Wks += weekData?.get('h3n2') || 0;
    });
    const totalLast4Wks = h1n1Last4Wks + h3n2Last4Wks;
    let dominantSubtype = 'Mixed';
    if (totalLast4Wks > 0) {
      if (h1n1Last4Wks / totalLast4Wks > 0.6) dominantSubtype = 'H1N1';
      else if (h3n2Last4Wks / totalLast4Wks > 0.6) dominantSubtype = 'H3N2';
    }

    // --- START OF FIX for KPI 4: Last Updated ---
    
    // 1. Define the format string that matches your timestamp "10 July 2025 - 0530UTC"
    //    %d: day of the month
    //    %B: full month name (e.g., "July")
    //    %Y: year with century
    //    %H%M: hour and minute
    const parseDate = timeParse("%d %B %Y - %H%MUTC");
    const formatDate = timeFormat("%Y-%m-%d");
    let lastUpdated = '--';

    if (h1n1Totals && h1n1Totals.utcTimestamp) {
      // 2. Use our specific parser instead of the generic new Date()
      const dateObj = parseDate(h1n1Totals.utcTimestamp);

      // 3. The parser returns a valid Date object or `null` if it fails.
      //    This is a much cleaner way to check for validity.
      if (dateObj) {
        lastUpdated = formatDate(dateObj);
      } else {
        // This log will help if the format ever changes unexpectedly
        console.error(`Failed to parse timestamp: "${h1n1Totals.utcTimestamp}"`);
      }
    }
    // --- END OF FIX ---

    return { totalSequences, totalCountries, dominantSubtype, lastUpdated };
  }, [h1n1Data, h3n2Data, h1n1Totals, h3n2Totals]);


  return (
    <div className="grid gap-6">
      {/* Row 1: Headline KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sequences</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.totalSequences.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">H1N1 + H3N2 Combined</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries Reporting</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.totalCountries.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total unique countries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dominant Subtype</CardTitle>
            <BarChart4 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.dominantSubtype}</div>
            <p className="text-xs text-muted-foreground">In the last 4 weeks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Last Updated</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.lastUpdated}</div>
            <p className="text-xs text-muted-foreground">Timestamp of last refresh</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Global Variant Progression */}
      <div>
        {h1n1Data.length > 0 && h3n2Data.length > 0 ? (
          <VariantProgressionPlot h1n1Data={h1n1Data} h3n2Data={h3n2Data} />
        ) : (
          <PlaceholderCard title="Variant Progression Over Time" description="Data not available." />
        )}
      </div>

      {/* Row 3: Geographic Distribution & Monthly Trends */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {h1n1MapData.length > 0 && h3n2MapData.length > 0 ? (
            <GlobalGeoMap h1n1MapData={h1n1MapData} h3n2MapData={h3n2MapData} />
          ) : (
            <PlaceholderCard title="Global Geographic Distribution" description="Data not available." />
          )}
        </div>
        <div className="lg:col-span-2">
          {h1n1Data.length > 0 && h3n2Data.length > 0 ? (
            <GlobalMonthlyCountsPlot h1n1Data={h1n1Data} h3n2Data={h3n2Data} />
          ) : (
            <PlaceholderCard title="Global Submissions by Month" description="Data not available." />
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSituationReport;