import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CircleAlert } from 'lucide-react'; // Corrected icon import

interface PlaceholderCardProps {
  title: string;
  description?: string;
}

const PlaceholderCard: React.FC<PlaceholderCardProps> = ({ title, description }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-md bg-muted/50">
          <CircleAlert className="size-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Chart Not Implemented</p>
          <p className="text-xs text-muted-foreground/80">Placeholder for future visualization</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlaceholderCard;