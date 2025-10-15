import PlaceholderCard from '../PlaceholderCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDown, ArrowUp } from 'lucide-react';

const EmergingVariantsWatchlist = () => {
  return (
    <div className="grid gap-6">
      {/* Row 1: Master View */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Top 10 Emerging Variants</CardTitle>
            <CardDescription>Click a row to see detailed analysis below.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Rank</TableHead>
                  <TableHead>Clade/Lineage</TableHead>
                  <TableHead>Count (90d)</TableHead>
                  <TableHead className="text-right">Growth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="cursor-pointer">
                  <TableCell className="font-medium">1 <ArrowUp className="inline size-3 text-green-500" /></TableCell>
                  <TableCell>A/H1N1pdm09/6B.1A.5a.2a.1</TableCell>
                  <TableCell>1,234</TableCell>
                  <TableCell className="text-right">+5.2%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">2 <ArrowDown className="inline size-3 text-red-500" /></TableCell>
                  <TableCell>A/H3N2/3C.2a1b.2a.2b</TableCell>
                  <TableCell>987</TableCell>
                  <TableCell className="text-right">-1.1%</TableCell>
                </TableRow>
                 <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    ... more data to be loaded here ...
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <PlaceholderCard
          title="Top 10 Growth Comparison"
          description="Cumulative counts of watchlist variants"
        />
      </div>

      {/* Row 2: Detail View */}
      <Card className="border-primary/50 border-2">
        <CardHeader>
            <CardTitle>Detail View: <span className="text-primary font-mono">A/H1N1pdm09/6B.1A.5a.2a.1</span></CardTitle>
            <CardDescription>Deep dive into the selected variant's characteristics and spread.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
           <PlaceholderCard
            title="Growth Dynamics"
            description="Weekly new detections and growth rate"
          />
           <PlaceholderCard
            title="Geographic Footprint"
            description="Recency-aware map and continental trends"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergingVariantsWatchlist;