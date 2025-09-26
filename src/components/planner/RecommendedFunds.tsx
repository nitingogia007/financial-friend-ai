
"use client";

import { FormSection } from './FormSection';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Lightbulb, Wallet } from 'lucide-react';
import { recommendedFunds as defaultRecommendedFunds } from '@/lib/calculations';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface Props {
    funds: { [key: string]: string };
    setFunds: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
    investibleSurplus: number;
}

export function RecommendedFunds({ funds, setFunds, investibleSurplus }: Props) {
  
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
        <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-4 rounded-lg flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Wallet className="h-8 w-8 text-green-700 dark:text-green-300" />
            <span className="font-bold text-lg text-green-800 dark:text-green-200">What I can Invest / Month</span>
          </div>
          <span className="font-bold text-2xl text-green-700 dark:text-green-300 font-headline">
            ₹{investibleSurplus.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>
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
                        value={funds[key] || ''}
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
