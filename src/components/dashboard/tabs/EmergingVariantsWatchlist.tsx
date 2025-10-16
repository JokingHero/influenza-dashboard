import { useState, useEffect, useMemo } from 'react';
import { type EmergingVariant, type EmergingVariantRiser } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import EmergingVariantsTable from '../variants/EmergingVariantsTable';
import TopGrowthComparisonPlot from '../variants/TopGrowthComparisonPlot'; 
import GrowthDynamicsPlot from '../variants/GrowthDynamicsPlot';
import EmergingVariantGeoMap from '../variants/EmergingVariantGeoMap';
import ContinentalTrendPlot from '../variants/ContinentalTrendPlot';


const calculateWeeklyGrowthRate = (cumLoc: { count: number }[]): number => {
  if (!cumLoc || cumLoc.length < 2) return 0;

  const weeklyGrowthRates: number[] = [];
  for (let i = 1; i < cumLoc.length; i++) {
    const prevCount = cumLoc[i - 1].count;
    const currCount = cumLoc[i].count;
    if (prevCount > 0) {
      const growth = (currCount - prevCount) / prevCount;
      weeklyGrowthRates.push(growth);
    } else {
      weeklyGrowthRates.push(0); // No growth if starting from zero
    }
  }

  // Use a 4-week rolling average for smoothing
  const N = 4;
  if (weeklyGrowthRates.length === 0) return 0;

  const relevantRates = weeklyGrowthRates.length < N
    ? weeklyGrowthRates
    : weeklyGrowthRates.slice(-N);

  const sum = relevantRates.reduce((a, b) => a + b, 0);
  return sum / relevantRates.length;
};


const EmergingVariantsWatchlist = () => {
  const [variants, setVariants] = useState<EmergingVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<EmergingVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = import.meta.env.BASE_URL;
        const [recentVariantsRes, topRisersRes] = await Promise.all([
          fetch(`${baseUrl}emerging-variant/emergVar_recentVariants_mocked.json`),
          fetch(`${baseUrl}emerging-variant/emergVar_topRankingRisers_mocked.json`),
        ]);

        if (!recentVariantsRes.ok || !topRisersRes.ok) {
          throw new Error('Failed to fetch emerging variant data');
        }

        const recentVariantsData: Omit<EmergingVariant, 'uniqueId'>[] = await recentVariantsRes.json();
        const topRisersData: EmergingVariantRiser[] = await topRisersRes.json();

        const riserMap = new Map(topRisersData.map(r => [r.cladeLineage, r]));

        const processedData: EmergingVariant[] = recentVariantsData.map(variant => {
          const uniqueId = `${variant.cladeLineage}::${variant.dissimilarityProtmutlist}`;
          const riserInfo = riserMap.get(variant.cladeLineage);
          const weeklyGrowthRate = calculateWeeklyGrowthRate(variant.cumLoc);

          return {
            ...variant,
            uniqueId,
            prevRanking: riserInfo?.prevRanking,
            weeklyGrowthRate: weeklyGrowthRate,
          };
        }).sort((a, b) => a.currRanking - b.currRanking);

        setVariants(processedData);
        if (processedData.length > 0) {
          setSelectedVariant(processedData[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const detailViewContent = useMemo(() => {
    if (!selectedVariant) {
      return (
        <CardContent>
          <div className="flex items-center justify-center h-96 text-muted-foreground">
            Select a variant from the table to view details.
          </div>
        </CardContent>
      );
    }
    return (
      <>
        <CardHeader>
          <CardTitle>
            Detail View: <span className="text-primary font-mono text-base sm:text-lg md:text-xl">{selectedVariant.cladeLineage}</span>
          </CardTitle>
          <CardDescription>
            Antigenic Distance: {selectedVariant.average_antigenic_distance} — Deep dive into the selected variant's characteristics and spread.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          
          <EmergingVariantGeoMap variant={selectedVariant} />

          <div className="grid gap-6 lg:grid-cols-2">
            <GrowthDynamicsPlot variant={selectedVariant} />
            <ContinentalTrendPlot variant={selectedVariant} />
          </div>
        </CardContent>
      </>
    );
  }, [selectedVariant]);

  if (loading) {
    return <EmergingVariantsWatchlistSkeleton />;
  }
  
  if (error) {
    return (
      <div className="text-destructive p-4 border border-destructive/50 rounded-md bg-destructive/10">
        Error loading variant watchlist: {error}
      </div>
    );
  }

  return (
    <div className="grid gap-6">

      <div className="grid gap-6 lg:grid-cols-2">
        <EmergingVariantsTable
          variants={variants}
          selectedVariant={selectedVariant}
          onSelectVariant={setSelectedVariant}
        />
        <TopGrowthComparisonPlot variants={variants} />
      </div>

      <Card className="border-primary/50 border-2">
        {detailViewContent}
      </Card>
    </div>
  );
};

const EmergingVariantsWatchlistSkeleton = () => (
  <div className="grid gap-6">
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
    <Card className="border-primary/50 border-2">
      <CardHeader>
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </CardContent>
    </Card>
  </div>
);

export default EmergingVariantsWatchlist;