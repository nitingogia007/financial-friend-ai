
"use client";

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Trash2, Loader2, BarChart, FileText } from 'lucide-react';
import type { FundAllocation, Fund, Goal, FundReturnsOutput, FundCategory, FactsheetData } from '@/lib/types';
import { getFundReturns } from '@/ai/flows/fund-returns-flow';
import { analyzeFactsheet } from '@/ai/flows/analyze-factsheet-flow';
import { FactsheetDisplay } from './FactsheetDisplay';
import { useToast } from '@/hooks/use-toast';

interface FundAllocationItemProps {
  alloc: FundAllocation;
  funds: Fund[];
  fundNames: string[];
  isLoadingFunds: boolean;
  availableGoals: Goal[];
  onUpdate: (id: string, field: keyof FundAllocation, value: string | number) => void;
  onRemove: (id: string) => void;
}

const fundCategories: FundCategory[] = ['Equity', 'Debt', 'Hybrid', 'Solution-Oriented', 'Others'];

export function FundAllocationItem({
  alloc,
  funds,
  fundNames,
  isLoadingFunds,
  availableGoals,
  onUpdate,
  onRemove,
}: FundAllocationItemProps) {
  const { toast } = useToast();
  const selectedFund = funds.find(f => f.fundName === alloc.fundName);
  const schemes = useMemo(() => selectedFund ? selectedFund.schemes.map(s => s.schemeName) : [], [selectedFund]);
  
  const [returns, setReturns] = useState<FundReturnsOutput | null>(null);
  const [isLoadingReturns, setIsLoadingReturns] = useState(false);

  const [factsheetData, setFactsheetData] = useState<FactsheetData | null>(null);
  const [isLoadingFactsheet, setIsLoadingFactsheet] = useState(false);
  const [factsheetError, setFactsheetError] = useState<string | null>(null);
  const [factsheetsMap, setFactsheetsMap] = useState<Record<string, string>>({});

  // Load the factsheet mapping file
  useEffect(() => {
    fetch('/factsheets.json')
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load factsheets.json: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => setFactsheetsMap(data))
      .catch(err => {
        console.error("Could not load or parse factsheets.json", err);
        toast({
          title: "Factsheet Manifest Missing",
          description: "Could not load factsheets.json. Please ensure the file exists in the /public folder.",
          variant: "destructive",
        });
      });
  }, [toast]);


  const handleSchemeChange = async (value: string) => {
    onUpdate(alloc.id, 'schemeName', value);
    const selectedScheme = selectedFund?.schemes.find(s => s.schemeName === value);
    
    // Clear previous factsheet data immediately on change
    setFactsheetData(null);
    setFactsheetError(null);

    if (selectedScheme) {
        onUpdate(alloc.id, 'schemeCode', selectedScheme.schemeCode.toString());
        
        // Trigger factsheet analysis
        const pdfUrl = factsheetsMap[selectedScheme.schemeName];
        if (pdfUrl) {
            setIsLoadingFactsheet(true);
            try {
                const data = await analyzeFactsheet(pdfUrl);
                setFactsheetData(data);
            } catch (error) {
                console.error("Failed to analyze factsheet:", error);
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                setFactsheetError(errorMessage);
                toast({
                    title: "Factsheet Analysis Failed",
                    description: errorMessage,
                    variant: "destructive",
                });
            } finally {
                setIsLoadingFactsheet(false);
            }
        } else {
           setFactsheetError(`No factsheet URL found for "${selectedScheme.schemeName}" in factsheets.json.`);
        }
    }
  };


  useEffect(() => {
    const fetchReturns = async () => {
      if (alloc.schemeCode && alloc.schemeCode.length > 0) {
        setIsLoadingReturns(true);
        setReturns(null);
        try {
          const result = await getFundReturns({ schemeCode: Number(alloc.schemeCode) });
          setReturns(result);
        } catch (error) {
          console.error("Failed to fetch fund returns:", error);
          setReturns(null); // Clear returns on error
        } finally {
          setIsLoadingReturns(false);
        }
      } else {
        setReturns(null); // Clear returns if no scheme is selected
      }
    };

    const timeoutId = setTimeout(fetchReturns, 500); // Debounce API call
    return () => clearTimeout(timeoutId);

  }, [alloc.schemeCode]);

  return (
    <Card key={alloc.id} className="p-4 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7 text-destructive"
        onClick={() => onRemove(alloc.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor={`goalId-${alloc.id}`}>Goal Name</Label>
          <Select
            value={alloc.goalId}
            onValueChange={(value) => onUpdate(alloc.id, 'goalId', value)}
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
            onChange={(e) => onUpdate(alloc.id, 'sipRequired', e.target.value === '' ? '' : Number(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`fundCategory-${alloc.id}`}>Category</Label>
          <Select
            value={alloc.fundCategory}
            onValueChange={(value) => onUpdate(alloc.id, 'fundCategory', value)}
          >
            <SelectTrigger id={`fundCategory-${alloc.id}`}>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {fundCategories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`fundName-${alloc.id}`}>Mutual Fund</Label>
          <SearchableSelect
            options={fundNames}
            value={alloc.fundName}
            onChange={(value) => onUpdate(alloc.id, 'fundName', value)}
            placeholder={isLoadingFunds ? "Loading funds..." : "Search for a fund"}
            disabled={isLoadingFunds}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`schemeName-${alloc.id}`}>Scheme</Label>
          <SearchableSelect
            options={schemes}
            value={alloc.schemeName}
            onChange={handleSchemeChange}
            placeholder={!alloc.fundName ? "Select a fund first" : "Search for a scheme"}
            disabled={!alloc.fundName || schemes.length === 0}
          />
        </div>
        <div className="flex items-end">
           {/* Placeholder for alignment */}
        </div>
      </div>
      {(isLoadingReturns || returns) && (
        <Card className="mt-4 bg-accent/10">
          <CardContent className="p-3">
             <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm text-accent-foreground/90">
                <BarChart className="h-4 w-4" /> Fund Returns (CAGR)
             </h4>
             {isLoadingReturns ? (
                <div className="flex items-center justify-center h-16">
                    <Loader2 className="h-5 w-5 animate-spin" />
                </div>
             ) : returns ? (
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                        <p className="text-xs text-muted-foreground">3-Year</p>
                        <p className="font-bold text-base">{returns.threeYearReturn ?? 'N/A'}</p>
                    </div>
                     <div>
                        <p className="text-xs text-muted-foreground">5-Year</p>
                        <p className="font-bold text-base">{returns.fiveYearReturn ?? 'N/A'}</p>
                    </div>
                     <div>
                        <p className="text-xs text-muted-foreground">10-Year</p>
                        <p className="font-bold text-base">{returns.tenYearReturn ?? 'N/A'}</p>
                    </div>
                </div>
             ) : null}
          </CardContent>
        </Card>
      )}
      {(isLoadingFactsheet || factsheetData || factsheetError) && (
          <div className="mt-4">
              {isLoadingFactsheet ? (
                  <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
                      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                      <p className="text-muted-foreground">Analyzing Factsheet...</p>
                  </div>
              ) : factsheetError ? (
                  <div className="p-4 border-2 border-dashed border-destructive/50 rounded-lg text-destructive text-center">
                      <p className="text-sm">{factsheetError}</p>
                  </div>
              ) : factsheetData ? (
                  <div className="animate-in fade-in-50">
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm text-accent-foreground/90">
                        <FileText className="h-4 w-4" /> Factsheet: {factsheetData.fundName}
                    </h4>
                    <FactsheetDisplay data={factsheetData} />
                  </div>
              ) : null}
          </div>
      )}
    </Card>
  );
}
