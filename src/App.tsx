import { useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGlobalData } from './hooks/useGlobalData';

// Import the tab components
import GlobalSituationReport from './components/dashboard/tabs/GlobalSituationReport';
import EmergingVariantsWatchlist from './components/dashboard/tabs/EmergingVariantsWatchlist';
import SurveillanceMetrics from './components/dashboard/tabs/SurveillanceMetrics';

function App() {
  const { data, loading, error } = useGlobalData();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const renderContent = () => {
    if (loading) {
      // Return a skeleton or minimal loading state for the content area only
      return <div className="mt-6">Loading dashboard data...</div>;
    }

    if (error || !data) {
      return (
        <div className="mt-6 min-h-screen flex items-center justify-center bg-background">
          <div className="text-destructive p-4 border border-destructive/50 rounded-md bg-destructive/10">
            Error loading essential dashboard data. Please check data files or network connection.
          </div>
        </div>
      );
    }
    
    // Data is loaded, render the tabs with content
    return (
      <TabsContent value="global-situation" className="mt-6">
        <GlobalSituationReport
          h1n1Data={data.h1n1Weekly}
          h3n2Data={data.h3n2Weekly}
          h1n1Totals={data.h1n1Totals}
          h3n2Totals={data.h3n2Totals}
          h1n1MapData={data.h1n1MapData}
          h3n2MapData={data.h3n2MapData}
        />
      </TabsContent>
    );
  };

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background/90">
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <header className="relative flex flex-col sm:flex-row sm:justify-between items-center gap-4 mb-6">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Influenza Surveillance Dashboard</h1>
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

            {renderContent()}
            
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