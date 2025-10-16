import { useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { type LatestStrain, type LatestStrainSubmitted, type CountryCount } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Globe2 } from 'lucide-react';
import CountryContributionPlot from '../metrics/CountryContributionPlot';

const SurveillanceMetrics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Raw data state
  const [allCollections, setAllCollections] = useState<LatestStrain[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<LatestStrainSubmitted[]>([]);
  const [allCountryCounts, setAllCountryCounts] = useState<CountryCount[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          collectionsH1, collectionsH3,
          submissionsH1, submissionsH3,
          countryCountsH1, countryCountsH3,
        ] = await Promise.all([
          fetch('/variant-tracker/latestStrains_h1n1.json').then(res => res.json()),
          fetch('/variant-tracker/latestStrains_h3n2.json').then(res => res.json()),
          fetch('/variant-tracker/latestStrainsSubmitted_h1n1.json').then(res => res.json()),
          fetch('/variant-tracker/latestStrainsSubmitted_h3n2.json').then(res => res.json()),
          fetch('/variant-tracker/countryCount_h1n1.json').then(res => res.json()),
          fetch('/variant-tracker/countryCount_h3n2.json').then(res => res.json()),
        ]);
        
        setAllCollections([...collectionsH1, ...collectionsH3]);
        setAllSubmissions([...submissionsH1, ...submissionsH3]);
        setAllCountryCounts([...countryCountsH1, ...countryCountsH3]);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch surveillance data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const { kpiData, countryContributionData, recentCollections, recentSubmissions } = useMemo(() => {
    if (loading || error) return { kpiData: {}, countryContributionData: [], recentCollections: [], recentSubmissions: [] };

    // --- KPI & Country Contribution Processing ---
    const collectionDateMap = new Map<string, string>();
    allCollections.forEach(s => {
      collectionDateMap.set(s.accession_id, s.collection_date);
    });

    const latencies: number[] = [];
    allSubmissions.forEach(submission => {
      const collectionDate = collectionDateMap.get(submission.accession_id);
      if (collectionDate) {
        const diff = d3.timeDay.count(new Date(collectionDate), new Date(submission.submission_date));
        if (diff >= 0) {
          latencies.push(diff);
        }
      }
    });
    const avgLatency = d3.mean(latencies);
    
    // Country contribution data aggregation
    const countryData = new Map<string, { total: number; last4wks: number }>();
    allCountryCounts.forEach(({ country, total, numcountrytotal_last4wks }) => {
      const existing = countryData.get(country) || { total: 0, last4wks: 0 };
      existing.total += total;
      existing.last4wks += numcountrytotal_last4wks;
      countryData.set(country, existing);
    });
    
    const topSubmittingCountry = [...countryData.entries()].sort((a, b) => b[1].last4wks - a[1].last4wks)[0]?.[0] || 'N/A';
    const countryContribution = Array.from(countryData.entries())
      .map(([country, data]) => ({ country, total: data.total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);

    // --- Table data ---
    const sortedCollections = [...allCollections].sort((a, b) => b.collection_date.localeCompare(a.collection_date)).slice(0, 50);
    const sortedSubmissions = [...allSubmissions].sort((a, b) => b.submission_date.localeCompare(a.submission_date)).slice(0, 50);

    return {
      kpiData: { averageLatency: avgLatency, topSubmittingCountry },
      countryContributionData: countryContribution,
      recentCollections: sortedCollections,
      recentSubmissions: sortedSubmissions
    };
  }, [loading, error, allCollections, allSubmissions, allCountryCounts]);


  if (loading) {
    return (
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
        <Skeleton className="h-96" />
        <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive p-4 border border-destructive/50 rounded-md bg-destructive/10">Error: {error}</div>;
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2">
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Data Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.averageLatency ? kpiData.averageLatency.toFixed(1) : '--'} Days</div>
            <p className="text-xs text-muted-foreground">Collection to submission time</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Submitting Country</CardTitle>
            <Globe2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.topSubmittingCountry || '--'}</div>
            <p className="text-xs text-muted-foreground">In the last 4 weeks</p>
          </CardContent>
        </Card>
      </div>
      
      <CountryContributionPlot data={countryContributionData} />

      <div className="grid gap-6 lg:grid-cols-2">
          <Card className="min-w-0">
            <CardHeader><CardTitle>Most Recent Sample Collections</CardTitle></CardHeader>
            <CardContent className="h-96 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card"><TableRow><TableHead>Strain</TableHead><TableHead>Country</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {recentCollections.map((s, i) => (
                    <TableRow key={`${s.accession_id}-${i}`}><TableCell className="font-mono text-xs">{s.strain_name}</TableCell><TableCell>{s.country}</TableCell><TableCell>{s.collection_date}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="min-w-0">
            <CardHeader><CardTitle>Most Recent Database Submissions</CardTitle></CardHeader>
            <CardContent className="h-96 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card"><TableRow><TableHead>Strain</TableHead><TableHead>Country</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {recentSubmissions.map((s, i) => (
                    <TableRow key={`${s.accession_id}-${i}`}><TableCell className="font-mono text-xs">{s.strain_name}</TableCell><TableCell>{s.country}</TableCell><TableCell>{s.submission_date}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
      </div>
    </div>
  );
};

export default SurveillanceMetrics;