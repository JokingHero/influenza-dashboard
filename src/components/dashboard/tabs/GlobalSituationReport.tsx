import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VariantProgressionPlot from '../VariantProgressionPlot';
import PlaceholderCard from '../PlaceholderCard';
import { type WeekRegionData } from '@/types';
import { Database, Globe, CalendarDays, BarChart4 } from 'lucide-react';

interface GlobalSituationReportProps {
  h1n1Data: WeekRegionData;
  h3n2Data: WeekRegionData;
}

const GlobalSituationReport: React.FC<GlobalSituationReportProps> = ({ h1n1Data, h3n2Data }) => {
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
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">H1N1 + H3N2 Combined</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries Reporting</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Total unique countries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dominant Subtype</CardTitle>
            <BarChart4 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">In the last 4 weeks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Last Updated</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
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
          <PlaceholderCard
            title="Global Geographic Distribution"
            description="Combined H1N1 & H3N2 view with dominance coloring"
          />
        </div>
        <div className="lg:col-span-2">
          <PlaceholderCard
            title="Global Submissions by Month"
            description="Total sequences submitted globally per month"
          />
        </div>
      </div>
    </div>
  );
};

export default GlobalSituationReport;