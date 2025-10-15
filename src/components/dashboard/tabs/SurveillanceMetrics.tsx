import PlaceholderCard from '../PlaceholderCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, Globe2 } from 'lucide-react';


const SurveillanceMetrics = () => {
  return (
    <div className="grid gap-6">
      {/* Row 1: KPIs */}
      <div className="grid gap-4 md:grid-cols-2">
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Data Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-- Days</div>
            <p className="text-xs text-muted-foreground">Collection to submission time</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Submitting Country</CardTitle>
            <Globe2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">In the last 4 weeks</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Regional Trends */}
       <PlaceholderCard
          title="Smoothed Relative Variant Frequency per Region"
          description="A grid of small line charts showing trends by continent"
        />
      
      {/* Row 3: Country Contribution */}
      <PlaceholderCard
          title="Top 20 Country Submissions & Latency"
          description="Combined bar chart showing submission volume and speed"
        />

      {/* Row 4: Raw Data Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Most Recent Sample Collections</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Strain</TableHead><TableHead>Country</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                <TableBody><TableRow><TableCell colSpan={3} className="h-24 text-center">Raw data will be displayed here.</TableCell></TableRow></TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Most Recent Database Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Strain</TableHead><TableHead>Country</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                <TableBody><TableRow><TableCell colSpan={3} className="h-24 text-center">Raw data will be displayed here.</TableCell></TableRow></TableBody>
              </Table>
            </CardContent>
          </Card>
      </div>
    </div>
  );
};

export default SurveillanceMetrics;