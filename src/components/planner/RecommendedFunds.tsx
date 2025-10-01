
"use client";

import { useMemo, useState, useEffect } from 'react';
import { FormSection } from './FormSection';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, Wallet, PlusCircle, LineChart, Loader2, PieChart, Percent, Info } from 'lucide-react';
import { Label } from '../ui/label';
import { GoalsBreakdown } from './GoalsBreakdown';
import type { SipOptimizerGoal, FundAllocation, Goal, ModelPortfolioOutput, Fund } from '@/lib/types';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { getModelPortfolioData } from '@/ai/flows/model-portfolio-flow';
import { fetchFunds } from '@/ai/flows/fetch-funds-flow';
import { PortfolioNiftyChart } from '../charts/PortfolioNiftyChart';
import { useToast } from '@/hooks/use-toast';
import { FundAllocationItem } from './FundAllocationItem';

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
      fundCategory: '',
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
  const fundHouseNames = useMemo(() => funds.map(f => f.fundName), [funds]);

  const portfolioAnalysis = useMemo(() => {
    const getNum = (val: number | '') => typeof val === 'number' ? val : 0;
    
    const equityTotal = allocations
        .filter(a => a.fundCategory === 'Equity')
        .reduce((sum, a) => sum + getNum(a.sipRequired), 0);
        
    const hybridTotal = allocations
        .filter(a => a.fundCategory === 'Hybrid')
        .reduce((sum, a) => sum + getNum(a.sipRequired), 0);

    const debtTotal = allocations
        .filter(a => a.fundCategory === 'Debt')
        .reduce((sum, a) => sum + getNum(a.sipRequired), 0);
        
    return {
        equity: equityTotal,
        hybrid: hybridTotal,
        debt: debtTotal,
    }
  }, [allocations]);

  const equityFundWeights = useMemo(() => {
    const getNum = (val: number | '' | undefined) => (typeof val === 'number' ? val : 0);

    const equityAllocations = allocations.filter(a => a.fundCategory === 'Equity' && getNum(a.sipRequired) > 0 && a.schemeCode);
    
    const totalEquitySip = equityAllocations.reduce((sum, a) => sum + getNum(a.sipRequired), 0);
    
    if (totalEquitySip === 0) return [];

    return equityAllocations.map(alloc => {
      const goal = availableGoals.find(g => g.id === alloc.goalId);
      return {
        ...alloc,
        goalName: goal?.otherType || goal?.name || 'Unlinked',
        weight: (getNum(alloc.sipRequired) / totalEquitySip) * 100,
        schemeCode: Number(alloc.schemeCode),
        schemeName: alloc.schemeName,
      };
    });
  }, [allocations, availableGoals]);

  const handleGenerateGraph = async () => {
    const fundsForApi = equityFundWeights
      .filter(f => f.schemeCode && f.weight > 0)
      .map(f => ({
        schemeCode: f.schemeCode!,
        schemeName: f.schemeName!,
        weight: f.weight,
      }));

    if (fundsForApi.length === 0) {
      toast({
        title: "No Equity Funds Selected",
        description: "Please allocate some SIP to valid equity funds with a category of 'Equity' to generate the comparison graph.",
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
          description: "Unable to retrieve historical data for the selected funds. Some funds may not have enough history.",
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
            {allocations.map((alloc) => (
              <FundAllocationItem
                key={alloc.id}
                alloc={alloc}
                funds={funds}
                fundNames={fundHouseNames}
                isLoadingFunds={isLoadingFunds}
                availableGoals={availableGoals}
                onUpdate={handleUpdateAllocation}
                onRemove={handleRemoveAllocation}
              />
            ))}
        </div>
        
        <Button variant="outline" size="sm" className="mt-4" onClick={handleAddAllocation}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Fund Allocation
        </Button>
        
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3 text-sm text-blue-800 dark:text-blue-300">
            <Info className="h-5 w-5 mt-0.5 shrink-0 text-blue-500"/>
            <p>If no suitable fund schemes are found, consider selecting "Mutual Funds" as an "Others" option. Then, proceed to search for the respective scheme within this category.</p>
        </div>
        
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
