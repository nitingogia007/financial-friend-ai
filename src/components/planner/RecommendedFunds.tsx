
"use client";

import { FormSection } from './FormSection';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Lightbulb } from 'lucide-react';
import { recommendedFunds } from '@/lib/calculations';

export function RecommendedFunds() {
  return (
    <FormSection
      title="Recommended Funds"
      description="Example funds for each asset category based on our research."
      icon={<Lightbulb className="h-6 w-6" />}
      className="xl:col-span-2"
    >
      <Card className="bg-accent/5">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Example Fund</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(recommendedFunds).map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell className="font-medium">{key}</TableCell>
                  <TableCell>{value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground mt-4">
        Disclaimer: These are example funds for educational purposes only and do not constitute investment advice. Please consult with your financial advisor before making any investment decisions.
      </p>
    </FormSection>
  );
}
