
"use client";

import { FormSection } from './FormSection';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, Wallet, PlusCircle, Trash2 } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { GoalsBreakdown } from './GoalsBreakdown';
import type { SipOptimizerGoal, FundAllocation, Goal } from '@/lib/types';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface Props {
    allocations: FundAllocation[];
    setAllocations: React.Dispatch<React.SetStateAction<FundAllocation[]>>;
    investibleSurplus: number;
    optimizedGoals: SipOptimizerGoal[];
    goals: Goal[];
}

let nextId = 0;

export function RecommendedFunds({ allocations, setAllocations, investibleSurplus, optimizedGoals, goals }: Props) {
  
  const handleAddAllocation = () => {
    setAllocations(prev => [...prev, {
      id: `new-${nextId++}`,
      goalId: '',
      largeCap: '',
      midCap: '',
      smallCap: '',
      multiFlexiCap: '',
      sectoral: '',
      debt: '',
      hybrid: '',
    }]);
  };

  const handleUpdateAllocation = (id: string, field: keyof FundAllocation, value: string) => {
    setAllocations(prev => prev.map(alloc => alloc.id === id ? { ...alloc, [field]: value } : alloc));
  };
  
  const handleRemoveAllocation = (id: string) => {
    setAllocations(prev => prev.filter(alloc => alloc.id !== id));
  };
  
  const availableGoals = goals.filter(g => g.name && g.name !== 'Retirement');

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
            {allocations.map((alloc) => (
                <Card key={alloc.id} className="p-4 relative">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 h-7 w-7 text-destructive"
                        onClick={() => handleRemoveAllocation(alloc.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-1.5 md:col-span-full">
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
                            <Label htmlFor={`largeCap-${alloc.id}`}>Large Cap</Label>
                            <Input id={`largeCap-${alloc.id}`} value={alloc.largeCap} onChange={(e) => handleUpdateAllocation(alloc.id, 'largeCap', e.target.value)} placeholder="e.g. Canara Robeco Bluechip"/>
                        </div>
                         <div className="space-y-1.5">
                            <Label htmlFor={`midCap-${alloc.id}`}>Mid Cap</Label>
                            <Input id={`midCap-${alloc.id}`} value={alloc.midCap} onChange={(e) => handleUpdateAllocation(alloc.id, 'midCap', e.target.value)} placeholder="e.g. PGIM India Midcap"/>
                        </div>
                         <div className="space-y-1.5">
                            <Label htmlFor={`smallCap-${alloc.id}`}>Small Cap</Label>
                            <Input id={`smallCap-${alloc.id}`} value={alloc.smallCap} onChange={(e) => handleUpdateAllocation(alloc.id, 'smallCap', e.target.value)} placeholder="e.g. Nippon India Small Cap"/>
                        </div>
                         <div className="space-y-1.5">
                            <Label htmlFor={`multiFlexiCap-${alloc.id}`}>Multi + Flexi Cap</Label>
                            <Input id={`multiFlexiCap-${alloc.id}`} value={alloc.multiFlexiCap} onChange={(e) => handleUpdateAllocation(alloc.id, 'multiFlexiCap', e.target.value)} placeholder="e.g. Parag Parikh Flexi Cap"/>
                        </div>
                         <div className="space-y-1.5">
                            <Label htmlFor={`sectoral-${alloc.id}`}>Sectoral</Label>
                            <Input id={`sectoral-${alloc.id}`} value={alloc.sectoral} onChange={(e) => handleUpdateAllocation(alloc.id, 'sectoral', e.target.value)} placeholder="e.g. ICICI Pru Tech"/>
                        </div>
                         <div className="space-y-1.5">
                            <Label htmlFor={`debt-${alloc.id}`}>Debt</Label>
                            <Input id={`debt-${alloc.id}`} value={alloc.debt} onChange={(e) => handleUpdateAllocation(alloc.id, 'debt', e.target.value)} placeholder="e.g. HDFC Gilt Fund"/>
                        </div>
                         <div className="space-y-1.5">
                            <Label htmlFor={`hybrid-${alloc.id}`}>Hybrid</Label>
                            <Input id={`hybrid-${alloc.id}`} value={alloc.hybrid} onChange={(e) => handleUpdateAllocation(alloc.id, 'hybrid', e.target.value)} placeholder="e.g. SBI Equity Hybrid"/>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
        
        <Button variant="outline" size="sm" className="mt-4" onClick={handleAddAllocation}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Fund Allocation
        </Button>
        
        <p className="text-xs text-muted-foreground mt-4">
            Disclaimer: These are example funds for educational purposes only and do not constitute investment advice. Please consult with your financial advisor before making any investment decisions.
        </p>
    </FormSection>
  );
}

    