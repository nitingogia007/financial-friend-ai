

"use client";

import { FormSection } from './FormSection';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, Wallet, PlusCircle, Trash2, TrendingUp } from 'lucide-react';
import { Label } from '../ui/label';
import { GoalsBreakdown } from './GoalsBreakdown';
import type { SipOptimizerGoal, FundAllocation, Goal } from '@/lib/types';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { fundData } from '@/lib/calculations';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface Props {
    allocations: FundAllocation[];
    setAllocations: React.Dispatch<React.SetStateAction<FundAllocation[]>>;
    investibleSurplus: number;
    optimizedGoals: SipOptimizerGoal[];
    goals: Goal[];
}

let nextId = 0;
const fundCategories = Object.keys(fundData);

export function RecommendedFunds({ allocations, setAllocations, investibleSurplus, optimizedGoals, goals }: Props) {
  
  const handleAddAllocation = () => {
    setAllocations(prev => [...prev, {
      id: `new-${nextId++}`,
      goalId: '',
      fundCategory: '',
      fundName: '',
    }]);
  };

  const handleUpdateAllocation = (id: string, field: keyof FundAllocation, value: string) => {
    setAllocations(prev => prev.map(alloc => {
        if (alloc.id === id) {
            const updatedAlloc = { ...alloc, [field]: value };
            // Reset fundName if category changes
            if (field === 'fundCategory') {
                updatedAlloc.fundName = '';
            }
            return updatedAlloc;
        }
        return alloc;
    }));
  };
  
  const handleRemoveAllocation = (id: string) => {
    setAllocations(prev => prev.filter(alloc => alloc.id !== id));
  };
  
  const availableGoals = goals.filter(g => g.name && g.name !== 'Retirement');

  const getSelectedFundReturns = (fundName: string, fundCategory: string) => {
      if (!fundName || !fundCategory) return null;
      const categoryFunds = fundData[fundCategory as keyof typeof fundData];
      if (!categoryFunds) return null;
      const fund = categoryFunds.find(f => f.name === fundName);
      return fund?.returns || null;
  }

  return (
    <FormSection
      title="Fund Allocation & Goal Analysis"
      description="Allocate funds to your specific goals and see your breakdown."
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

        {optimizedGoals.length > 0 && <GoalsBreakdown optimizedGoals={optimizedGoals} />}
        
        <Separator className="my-8" />

        <h3 className="text-xl font-bold font-headline text-foreground mb-4">Fund Allocations by Goal</h3>
        
        <div className="space-y-4">
            {allocations.map((alloc) => {
                const selectedReturns = getSelectedFundReturns(alloc.fundName, alloc.fundCategory);
                const categoryFunds = fundData[alloc.fundCategory as keyof typeof fundData] || [];

                return (
                    <Card key={alloc.id} className="p-4 relative">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 right-2 h-7 w-7 text-destructive"
                            onClick={() => handleRemoveAllocation(alloc.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor={`goalId-${alloc.id}`}>Goal Name</Label>
                                <Select 
                                    value={alloc.goalId} 
                                    onValueChange={(value) => handleUpdateAllocation(alloc.id, 'goalId', value)}
                                >
                                    <SelectTrigger id={`goalId-${alloc.id}`}>
                                        <SelectValue placeholder="Select a goal to link" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableGoals.map(goal => (
                                            <SelectItem key={goal.id} value={goal.id}>
                                                {goal.otherType || goal.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor={`fundCategory-${alloc.id}`}>Fund Category</Label>
                                <Select 
                                    value={alloc.fundCategory} 
                                    onValueChange={(value) => handleUpdateAllocation(alloc.id, 'fundCategory', value)}
                                >
                                    <SelectTrigger id={`fundCategory-${alloc.id}`}>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {fundCategories.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <Label htmlFor={`fundName-${alloc.id}`}>Fund Name</Label>
                                <Select 
                                    value={alloc.fundName} 
                                    onValueChange={(value) => handleUpdateAllocation(alloc.id, 'fundName', value)}
                                    disabled={!alloc.fundCategory || categoryFunds.length === 0}
                                >
                                    <SelectTrigger id={`fundName-${alloc.id}`}>
                                        <SelectValue placeholder={
                                            !alloc.fundCategory ? "Select a category first" :
                                            categoryFunds.length === 0 ? "No funds in this category" :
                                            "Select a fund"
                                        } />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categoryFunds.map(fund => (
                                            <SelectItem key={fund.name} value={fund.name}>
                                                {fund.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {selectedReturns && (
                            <div className="mt-4 p-3 rounded-md bg-accent/10 animate-in fade-in-50">
                                <h4 className="font-semibold text-accent-foreground/90 mb-2 flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Fund Returns
                                </h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>3Y</TableHead>
                                            <TableHead>5Y</TableHead>
                                            <TableHead>10Y</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell className="font-medium">{selectedReturns['3Y']}</TableCell>
                                            <TableCell className="font-medium">{selectedReturns['5Y']}</TableCell>
                                            <TableCell className="font-medium">{selectedReturns['10Y']}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </Card>
                )
            })}
        </div>
        
        <Button variant="outline" size="sm" className="mt-4" onClick={handleAddAllocation}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Fund Allocation
        </Button>
        
        <p className="text-xs text-muted-foreground mt-4">
            Disclaimer: These are example funds for educational purposes only and do not constitute investment advice. Please consult with your financial advisor before making any investment decisions. Mutual fund investments are subject to market risks.
        </p>
    </FormSection>
  );
}
