import { useState, useEffect } from 'react';
// import './App.css'; // This is now deleted
import { Button } from './components/ui/button';
import { Moon, Sun } from 'lucide-react';

import VariantProgressionPlot from './components/dashboard/VariantProgressionPlot';
import MonthlyCountsPlot from './components/dashboard/MonthlyCountsPlot';
import GeoMap from './components/dashboard/GeoMap';
import { type WeekRegionData, type GeoMapData } from './types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';

function App() {
  const [h1n1Weekly, setH1n1Weekly] = useState<WeekRegionData | null>(null);
  const [h3n2Weekly, setH3n2Weekly] = useState<WeekRegionData | null>(null);
  const [h1n1Map, setH1n1Map] = useState<GeoMapData | null>(null);
  const [h3n2Map, setH3n2Map] = useState<GeoMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // This effect will toggle the 'dark' class on the HTML element
    const root = window.document.documentElement;
    root.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          h1n1WeeklyRes,
          h3n2WeeklyRes,
          h1n1MapRes,
          h3n2MapRes,
        ] = await Promise.all([
          fetch('/variant-tracker/weekRegion2perc_h1n1.json'),
          fetch('/variant-tracker/weekRegion2perc_h3n2.json'),
          fetch('/variant-tracker/map_h1n1.json'),
          fetch('/variant-tracker/map_h3n2.json'),
        ]);

        const h1n1WeeklyData = await h1n1WeeklyRes.json();
        const h3n2WeeklyData = await h3n2WeeklyRes.json();
        const h1n1MapData = await h1n1MapRes.json();
        const h3n2MapData = await h3n2MapRes.json();
        
        const isValidWeeklyData = (data: any) => Array.isArray(data) && data.length > 0 && data[0].continent !== 'string';
        
        setH1n1Weekly(isValidWeeklyData(h1n1WeeklyData) ? h1n1WeeklyData : []);
        setH3n2Weekly(isValidWeeklyData(h3n2WeeklyData) ? h3n2WeeklyData : []);
        setH1n1Map(h1n1MapData);
        setH3n2Map(h3n2MapData);

      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;
  }
  
  if (!h1n1Weekly || !h3n2Weekly || !h1n1Map || !h3n2Map) {
      return <div className="min-h-screen flex items-center justify-center">
        <div className="text-destructive">
          Error loading data. Please check data files in `/public`.
        </div>
      </div>
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Influenza Virus Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Visualizing the circulation of H1N1 and H3N2 subtypes worldwide.
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={() => setIsDarkMode(!isDarkMode)}>
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </header>

      <main className="grid gap-6">
        {h1n1Weekly.length > 0 && h3n2Weekly.length > 0 ? (
          <VariantProgressionPlot h1n1Data={h1n1Weekly} h3n2Data={h3n2Weekly} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Variant Progression Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Weekly data is not available to display this chart.</p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="h1n1" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="h1n1">H1N1 Data</TabsTrigger>
            <TabsTrigger value="h3n2">H3N2 Data</TabsTrigger>
          </TabsList>
          <TabsContent value="h1n1" className="grid gap-6 mt-4">
            {h1n1Weekly.length > 0 ? (
               <MonthlyCountsPlot data={h1n1Weekly} variantName="H1N1" />
            ) : (
                <Card><CardHeader><CardTitle>Counts by Month (H1N1)</CardTitle></CardHeader><CardContent><p>Data not available.</p></CardContent></Card>
            )}
            {h1n1Map.length > 0 ? (
                <GeoMap mapData={h1n1Map} variantName="H1N1" />
            ) : (
                 <Card><CardHeader><CardTitle>Geographic Distribution (H1N1)</CardTitle></CardHeader><CardContent><p>Data not available.</p></CardContent></Card>
            )}
          </TabsContent>
          <TabsContent value="h3n2" className="grid gap-6 mt-4">
            {h3n2Weekly.length > 0 ? (
               <MonthlyCountsPlot data={h3n2Weekly} variantName="H3N2" />
            ) : (
                <Card><CardHeader><CardTitle>Counts by Month (H3N2)</CardTitle></CardHeader><CardContent><p>Data not available.</p></CardContent></Card>
            )}
            {h3n2Map.length > 0 ? (
                <GeoMap mapData={h3n2Map} variantName="H3N2" />
            ) : (
                 <Card><CardHeader><CardTitle>Geographic Distribution (H3N2)</CardTitle></CardHeader><CardContent><p>Data not available.</p></CardContent></Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;