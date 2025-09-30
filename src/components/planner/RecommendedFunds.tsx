

"use client";

import { useMemo, useState, useEffect } from 'react';
import { FormSection } from './FormSection';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, Wallet, PlusCircle, Trash2, TrendingUp, PieChart, Percent, Loader2, LineChart } from 'lucide-react';
import { Label } from '../ui/label';
import { GoalsBreakdown } from './GoalsBreakdown';
import type { SipOptimizerGoal, FundAllocation, Goal, ModelPortfolioOutput, Fund, Scheme } from '@/lib/types';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Input } from '../ui/input';
import { getModelPortfolioData } from '@/ai/flows/model-portfolio-flow';
import { fetchFunds } from '@/ai/flows/fetch-funds-flow';
import { PortfolioNiftyChart } from '../charts/PortfolioNiftyChart';
import { useToast } from '@/hooks/use-toast';


interface Props {
    allocations: FundAllocation[];
    setAllocations: React.Dispatch<React.SetStateAction<FundAllocation[]>>;
    investibleSurplus: number;
    optimizedGoals: SipOptimizerGoal[];
    goals: Goal[];
}

let nextId = 0;

export function RecommendedFunds({ allocations, setAllocations, investibleSurplus, optimizedGoals, goals }: Props) {
  const [chartData, setChartData] = useState<ModelPortfolioOutput['chartData'] | null>(null);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const { toast } = useToast();
  const [funds, setFunds] = useState<Fund[]>([]);
  const [isLoadingFunds, setIsLoadingFunds] = useState(true);
  
  useEffect(() => {
    async function loadFunds() {
        try {
            const fetchedFunds = await fetchFunds();
            setFunds(fetchedFunds);
        } catch (error) {
            console.error("Failed to fetch funds:", error);
            toast({
                title: "Error",
                description: "Could not load the list of mutual funds. Please try refreshing.",
                variant: "destructive",
            });
        } finally {
            setIsLoadingFunds(false);
        }
    }
    loadFunds();
  }, [toast]);

  const handleAddAllocation = () => {
    setAllocations(prev => [...prev, {
      id: `new-${nextId++}`,
      goalId: '',
      sipRequired: '',
      fundName: '',
      schemeName: '',
      schemeCode: '',
    }]);
  };

  const handleUpdateAllocation = (id: string, field: keyof FundAllocation, value: string | number) => {
    setAllocations(prev => prev.map(alloc => {
        if (alloc.id === id) {
            const updatedAlloc = { ...alloc, [field]: value };
            if (field === 'fundName') {
                updatedAlloc.schemeName = '';
                updatedAlloc.schemeCode = '';
            }
            if (field === 'schemeName') {
                const selectedFund = funds.find(f => f.fundName === updatedAlloc.fundName);
                const selectedScheme = selectedFund?.schemes.find(s => s.schemeName === value);
                if (selectedScheme) {
                    updatedAlloc.schemeCode = selectedScheme.schemeCode.toString();
                }
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

  const portfolioAnalysis = useMemo(() => {
    const getNum = (val: number | '') => typeof val === 'number' ? val : 0;
    
    // Simple categorization based on scheme name for demo purposes
    const getCategory = (schemeName: string) => {
      const name = schemeName.toLowerCase();
      if (name.includes('equity') || name.includes('large cap') || name.includes('mid cap') || name.includes('small cap') || name.includes('multi cap') || name.includes('flexi cap')) return 'Equity';
      if (name.includes('hybrid') || name.includes('balanced')) return 'Hybrid';
      if (name.includes('debt') || name.includes('bond') || name.includes('gilt') || name.includes('liquid')) return 'Debt';
      return 'Other';
    }

    const equityTotal = allocations
        .filter(a => getCategory(a.schemeName) === 'Equity')
        .reduce((sum, a) => sum + getNum(a.sipRequired), 0);
        
    const hybridTotal = allocations
        .filter(a => getCategory(a.schemeName) === 'Hybrid')
        .reduce((sum, a) => sum + getNum(a.sipRequired), 0);

    const debtTotal = allocations
        .filter(a => getCategory(a.schemeName) === 'Debt')
        .reduce((sum, a) => sum + getNum(a.sipRequired), 0);
        
    return {
        equity: equityTotal,
        hybrid: hybridTotal,
        debt: debtTotal,
    }
  }, [allocations]);

  const equityFundWeights = useMemo(() => {
    const getNum = (val: number | '' | undefined) => (typeof val === 'number' ? val : 0);
    const equityCategories = ['Equity']; // Simplified for now
    
    const getCategory = (schemeName: string) => {
        const name = schemeName.toLowerCase();
        if (name.includes('equity') || name.includes('large cap') || name.includes('mid cap') || name.includes('small cap') || name.includes('multi cap') || name.includes('flexi cap')) return 'Equity';
        return 'Other';
    }

    const equityAllocations = allocations.filter(a => getCategory(a.schemeName) === 'Equity' && getNum(a.sipRequired) > 0);
    
    const totalEquitySip = equityAllocations.reduce((sum, a) => sum + getNum(a.sipRequired), 0);
    
    if (totalEquitySip === 0) return [];

    return equityAllocations.map(alloc => {
      const goal = availableGoals.find(g => g.id === alloc.goalId);
      return {
        ...alloc,
        goalName: goal?.otherType || goal?.name || 'Unlinked',
        weight: (getNum(alloc.sipRequired) / totalEquitySip) * 100,
        schemeCode: Number(alloc.schemeCode),
      };
    });
  }, [allocations, availableGoals]);

  const handleGenerateGraph = async () => {
    const fundsForApi = equityFundWeights
      .filter(f => f.weight > 0 && f.schemeCode)
      .map(f => ({
        schemeCode: f.schemeCode!,
        weight: f.weight,
      }));

    if (fundsForApi.length === 0) {
      toast({
        title: "No Equity Funds Selected",
        description: "Please allocate some SIP to equity funds to generate the comparison graph.",
        variant: "destructive"
      });
      return;
    }

    setIsChartLoading(true);
    setChartData(null);
    try {
      const result = await getModelPortfolioData({ funds: fundsForApi });
      if (result.chartData && result.chartData.length > 0) {
        setChartData(result.chartData);
      } else {
        toast({
          title: "Could Not Fetch Data",
          description: "Unable to retrieve historical data for the selected funds. Please try again later.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching model portfolio data:", error);
      toast({
        title: "Chart Generation Failed",
        description: "An unexpected error occurred while generating the graph.",
        variant: "destructive"
      });
      setChartData(null);
    } finally {
      setIsChartLoading(false);
    }
  };


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
                const selectedFund = funds.find(f => f.fundName === alloc.fundName);
                const schemes = selectedFund ? selectedFund.schemes : [];

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
                                <Label htmlFor={`sipRequired-${alloc.id}`}>SIP required for fund</Label>
                                <Input
                                    id={`sipRequired-${alloc.id}`}
                                    type="number"
                                    placeholder="e.g., 5000"
                                    value={alloc.sipRequired}
                                    onChange={(e) => handleUpdateAllocation(alloc.id, 'sipRequired', e.target.value === '' ? '' : Number(e.target.value))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor={`fundName-${alloc.id}`}>Mutual Fund</Label>
                                <Select 
                                    value={alloc.fundName} 
                                    onValueChange={(value) => handleUpdateAllocation(alloc.id, 'fundName', value)}
                                    disabled={isLoadingFunds}
                                >
                                    <SelectTrigger id={`fundName-${alloc.id}`}>
                                        <SelectValue placeholder={isLoadingFunds ? "Loading funds..." : "Select a fund"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {funds.map(fund => (
                                            <SelectItem key={fund.fundName} value={fund.fundName}>{fund.fundName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor={`schemeName-${alloc.id}`}>Scheme</Label>
                                <Select 
                                    value={alloc.schemeName} 
                                    onValueChange={(value) => handleUpdateAllocation(alloc.id, 'schemeName', value)}
                                    disabled={!alloc.fundName || schemes.length === 0}
                                >
                                    <SelectTrigger id={`schemeName-${alloc.id}`}>
                                        <SelectValue placeholder={!alloc.fundName ? "Select a fund first" : "Select a scheme"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {schemes.map(scheme => (
                                            <SelectItem key={scheme.schemeCode} value={scheme.schemeName}>
                                                {scheme.schemeName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </Card>
                )
            })}
        </div>
        
        <Button variant="outline" size="sm" className="mt-4" onClick={handleAddAllocation}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Fund Allocation
        </Button>
        
        <Separator className="my-8" />
        
        <h3 className="text-xl font-bold font-headline text-foreground mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Model Portfolio Analysis
        </h3>

        <Card className="p-4">
            <CardContent className="p-2 space-y-4">
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-base">Equity Holdings</span>
                    <span className="font-bold text-lg text-primary">₹{(portfolioAnalysis.equity).toLocaleString('en-IN')}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="font-semibold text-base">Hybrid Holdings</span>
                    <span className="font-bold text-lg text-primary">₹{portfolioAnalysis.hybrid.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-base">Debt Holdings</span>
                    <span className="font-bold text-lg text-primary">₹{portfolioAnalysis.debt.toLocaleString('en-IN')}</span>
                </div>
            </CardContent>
        </Card>

        <Separator className="my-8" />

        <h3 className="text-xl font-bold font-headline text-foreground mb-4 flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Equity Fund Weight Analysis
        </h3>

        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fund Name</TableHead>
                        <TableHead>Goal</TableHead>
                        <TableHead className="text-right">Weightage</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {equityFundWeights.length > 0 ? (
                        equityFundWeights.map(fund => (
                            <TableRow key={fund.id}>
                                <TableCell className="font-medium">{fund.schemeName}</TableCell>
                                <TableCell className="text-muted-foreground">{fund.goalName}</TableCell>
                                <TableCell className="text-right font-bold text-primary">{fund.weight.toFixed(2)}%</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                                No equity fund allocations yet.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Card>

        <div className="mt-6 text-center">
            <Button onClick={handleGenerateGraph} disabled={isChartLoading}>
                {isChartLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <LineChart className="mr-2 h-4 w-4" />}
                Generate Graph
            </Button>
        </div>

        {isChartLoading ? (
            <div className="flex items-center justify-center h-96 mt-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Fetching and analyzing historical data...</p>
            </div>
        ) : chartData && chartData.length > 0 ? (
            <PortfolioNiftyChart data={chartData} />
        ) : (
            chartData !== null && <div className="text-center text-muted-foreground mt-6">Click "Generate Graph" to see the portfolio comparison.</div>
        )}

        <p className="text-xs text-muted-foreground mt-4">
            Disclaimer: These are example funds for educational purposes only and do not constitute investment advice. Please consult with your financial advisor before making any investment decisions. Mutual fund investments are subject to market risks.
        </p>
    </FormSection>
  );
}
