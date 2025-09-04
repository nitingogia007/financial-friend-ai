
"use client";

import { FormSection } from './FormSection';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Lightbulb } from 'lucide-react';
import { recommendedFunds as defaultRecommendedFunds } from '@/lib/calculations';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface Props {
    funds: { [key: string]: string };
    setFunds: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
}

export function RecommendedFunds({ funds, setFunds }: Props) {
  
  const handleChange = (category: string, value: string) => {
    setFunds(prev => ({...prev, [category]: value}));
  }

  return (
    <FormSection
      title="Recommended Funds"
      description="Enter your preferred funds for each category. Examples are provided."
      icon={<Lightbulb className="h-6 w-6" />}
      className="xl:col-span-2"
    >
      <Card className="bg-accent/5">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Your Chosen Fund</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(defaultRecommendedFunds).map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell className="font-medium">
                    <Label htmlFor={`fund-${key}`}>{key}</Label>
                  </TableCell>
                  <TableCell>
                    <Input 
                        id={`fund-${key}`}
                        type="text"
                        placeholder={value}
                        value={funds[key]}
                        onChange={(e) => handleChange(key, e.target.value)}
                    />
                  </TableCell>
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
