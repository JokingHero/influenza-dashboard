import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { type EmergingVariant } from '@/types';
import { cn } from '@/lib/utils';

interface EmergingVariantsTableProps {
  variants: EmergingVariant[];
  selectedVariant: EmergingVariant | null;
  onSelectVariant: (variant: EmergingVariant) => void;
}

const RankChange: React.FC<{ prev?: number; curr: number }> = ({ prev, curr }) => {
  if (prev === undefined) {
    return <Minus className="inline size-3 text-muted-foreground" />;
  }
  const change = prev - curr;
  if (change > 0) {
    return <><ArrowUp className="inline size-3 text-green-500" /> {change}</>;
  }
  if (change < 0) {
    return <><ArrowDown className="inline size-3 text-red-500" /> {Math.abs(change)}</>;
  }
  return <Minus className="inline size-3 text-muted-foreground" />;
};


const EmergingVariantsTable: React.FC<EmergingVariantsTableProps> = ({ variants, selectedVariant, onSelectVariant }) => {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Top Emerging Variants</CardTitle>
        <CardDescription>Click a row to see detailed analysis below.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] px-4">Rank</TableHead>
                <TableHead className="px-4">Clade/Lineage</TableHead>
                <TableHead className="px-4">Key Mutations</TableHead>
                <TableHead className="text-right px-4">Count (90d)</TableHead>
                <TableHead className="text-right px-4">Weekly Growth</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant) => (
                <TableRow
                  key={variant.uniqueId}
                  className={cn(
                    "cursor-pointer",
                    selectedVariant?.uniqueId === variant.uniqueId && "bg-muted"
                  )}
                  onClick={() => onSelectVariant(variant)}
                >
                  <TableCell className="font-medium px-4">
                    {variant.currRanking} <RankChange prev={variant.prevRanking} curr={variant.currRanking} />
                  </TableCell>
                  <TableCell className="font-mono text-xs px-4">{variant.cladeLineage}</TableCell>
                  <TableCell className="text-muted-foreground text-xs truncate max-w-xs px-4" title={variant.dissimilarityProtmutlist}>
                      {variant.dissimilarityProtmutlist}
                  </TableCell>
                  <TableCell className="text-right px-4">{variant.count.toLocaleString()}</TableCell>
                  <TableCell className={cn(
                      "text-right font-medium px-4",
                      variant.weeklyGrowthRate && variant.weeklyGrowthRate > 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
                  )}>
                      {variant.weeklyGrowthRate !== undefined ? `${(variant.weeklyGrowthRate * 100).toFixed(1)}%` : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmergingVariantsTable;