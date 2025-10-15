import { useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { type WeekRegionData, type CountryCountTotal, type GeoMapData } from './types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import the new tab components
import GlobalSituationReport from './components/dashboard/tabs/GlobalSituationReport';
import EmergingVariantsWatchlist from './components/dashboard/tabs/EmergingVariantsWatchlist';
import SurveillanceMetrics from './components/dashboard/tabs/SurveillanceMetrics';

function App() {
  const [h1n1Weekly, setH1n1Weekly] = useState<WeekRegionData | null>(null);
  const [h3n2Weekly, setH3n2Weekly] = useState<WeekRegionData | null>(null);
  const [h1n1Totals, setH1n1Totals] = useState<CountryCountTotal | null>(null);
  const [h3n2Totals, setH3n2Totals] = useState<CountryCountTotal | null>(null);
  const [h1n1MapData, setH1n1MapData] = useState<GeoMapData | null>(null);
  const [h3n2MapData, setH3n2MapData] = useState<GeoMapData | null>(null);

  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          h1n1WeeklyRes, h3n2WeeklyRes,
          h1n1TotalsRes, h3n2TotalsRes,
          h1n1MapRes, h3n2MapRes,
        ] = await Promise.all([
          fetch('/variant-tracker/weekRegion2perc_h1n1.json'),
          fetch('/variant-tracker/weekRegion2perc_h3n2.json'),
          fetch('/variant-tracker/countryCountTotal_h1n1.json'),
          fetch('/variant-tracker/countryCountTotal_h3n2.json'),
          fetch('/variant-tracker/map_h1n1.json'),
          fetch('/variant-tracker/map_h3n2.json'),
        ]);

        const h1n1WeeklyData = await h1n1WeeklyRes.json();
        const h3n2WeeklyData = await h3n2WeeklyRes.json();
        const h1n1TotalsData = await h1n1TotalsRes.json();
        const h3n2TotalsData = await h3n2TotalsRes.json();
        const h1n1MapRawData = await h1n1MapRes.json();
        const h3n2MapRawData = await h3n2MapRes.json();
        
        const isValidWeeklyData = (data: any): data is WeekRegionData => Array.isArray(data) && data.length > 0;
        
        setH1n1Weekly(isValidWeeklyData(h1n1WeeklyData) ? h1n1WeeklyData : []);
        setH3n2Weekly(isValidWeeklyData(h3n2WeeklyData) ? h3n2WeeklyData : []);
        setH1n1Totals(h1n1TotalsData?.[0] || null);
        setH3n2Totals(h3n2TotalsData?.[0] || null);
        setH1n1MapData(Array.isArray(h1n1MapRawData) ? h1n1MapRawData : []);
        setH3n2MapData(Array.isArray(h3n2MapRawData) ? h3n2MapRawData : []);

      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading dashboard...</div>;
  }
  
  const hasError = !h1n1Weekly || !h3n2Weekly || !h1n1Totals || !h3n2Totals || !h1n1MapData || !h3n2MapData;
  if (hasError) {
      return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-destructive p-4 border border-destructive/50 rounded-md bg-destructive/10">
          Error loading essential dashboard data. Please check data files in `/public`.
        </div>
      </div>
  }

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background/90">
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <header className="relative flex flex-col sm:flex-row sm:justify-between items-center gap-4 mb-6">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Influenza Surveillance Monitor</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Global H1N1 & H3N2 Subtype Circulation
            </p>
          </div>
          <div className="shrink-0">
              <Button variant="outline" size="icon" onClick={() => setIsDarkMode(!isDarkMode)}>
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
              </Button>
          </div>
        </header>

        <main>
          <Tabs defaultValue="global-situation" className="w-full">
            <TabsList className="h-auto sm:h-9 grid w-full grid-cols-1 sm:grid-cols-3 sm:w-fit mx-auto sm:mx-0">
              <TabsTrigger value="global-situation">Global Situation</TabsTrigger>
              <TabsTrigger value="variants-watchlist">Variants Watchlist</TabsTrigger>
              <TabsTrigger value="surveillance-metrics">Surveillance Metrics</TabsTrigger>
            </TabsList>

            <TabsContent value="global-situation" className="mt-6">
              <GlobalSituationReport 
                h1n1Data={h1n1Weekly} 
                h3n2Data={h3n2Weekly}
                h1n1Totals={h1n1Totals}
                h3n2Totals={h3n2Totals}
                h1n1MapData={h1n1MapData}
                h3n2MapData={h3n2MapData}
              />
            </TabsContent>
            
            <TabsContent value="variants-watchlist" className="mt-6">
              <EmergingVariantsWatchlist />
            </TabsContent>
            
            <TabsContent value="surveillance-metrics" className="mt-6">
              <SurveillanceMetrics />
            </TabsContent>

          </Tabs>
        </main>
      </div>
    </div>
  );
}

export default App;