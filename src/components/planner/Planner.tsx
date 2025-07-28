"use client";

import { useState, useEffect, useMemo } from 'react';
import { summarizeFinancialStatus } from '@/ai/flows/financial-status-summary';
import type { Asset, Liability, Income, Expense, Insurance, Goal, PersonalDetails, ReportData, GoalWithSip } from '@/lib/types';
import { calculateSip, calculateAge } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

import { Header } from './Header';
import { PersonalDetailsForm } from './PersonalDetailsForm';
import { AssetsLiabilitiesForm } from './AssetsLiabilitiesForm';
import { IncomeExpensesForm } from './IncomeExpensesForm';
import { InsuranceForm } from './InsuranceForm';
import { GoalsForm } from './GoalsForm';
import { Report } from './Report';

export function Planner() {
  const { toast } = useToast();

  const [personalDetails, setPersonalDetails] = useState<PersonalDetails>({ name: '', dob: '', dependents: '', retirementAge: '', mobile: '', email: '', arn: '' });
  const [assets, setAssets] = useState<Asset[]>([{ id: '1', type: 'Bank', amount: 500000 }]);
  const [liabilities, setLiabilities] = useState<Liability[]>([{ id: '1', type: 'Credit Card', amount: 50000 }]);
  const [incomes, setIncomes] = useState<Income[]>([{ id: '1', source: 'Salary', amount: 1200000 }]);
  const [expenses, setExpenses] = useState<Expense[]>([{ id: '1', type: 'Rent', amount: 360000 }]);
  const [goals, setGoals] = useState<Goal[]>([{ id: '1', name: 'Retirement', corpus: 20000000, years: 25, rate: 12 }]);
  
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const getNumericValue = (val: number | '') => typeof val === 'number' ? val : 0;

  const age = useMemo(() => calculateAge(personalDetails.dob), [personalDetails.dob]);

  const totalAssets = useMemo(() => assets.reduce((sum, a) => sum + getNumericValue(a.amount), 0), [assets]);
  const totalLiabilities = useMemo(() => liabilities.reduce((sum, l) => sum + getNumericValue(l.amount), 0), [liabilities]);
  const netWorth = useMemo(() => totalAssets - totalLiabilities, [totalAssets, totalLiabilities]);
  
  const totalAnnualIncome = useMemo(() => incomes.reduce((sum, i) => sum + getNumericValue(i.amount), 0), [incomes]);
  const totalAnnualExpenses = useMemo(() => expenses.reduce((sum, e) => sum + getNumericValue(e.amount), 0), [expenses]);
  const yearlyCashflow = useMemo(() => totalAnnualIncome - totalAnnualExpenses, [totalAnnualIncome, totalAnnualExpenses]);
  const monthlyCashflow = useMemo(() => yearlyCashflow / 12, [yearlyCashflow]);

  // This state is not used in the new InsuranceForm, but we'll keep it for the report generation logic.
  const [insurances, setInsurances] = useState<Insurance[]>([{ id: '1', type: 'Life', cover: 10000000, premium: 25000 }]);
  const totalInsuranceCover = useMemo(() => insurances.reduce((sum, i) => sum + getNumericValue(i.cover), 0), [insurances]);
  const totalInsurancePremium = useMemo(() => insurances.reduce((sum, i) => sum + getNumericValue(i.premium), 0), [insurances]);

  const goalsWithSip = useMemo<GoalWithSip[]>(() => goals.map(g => ({ ...g, sip: calculateSip(g) })), [goals]);

  const handleGenerateReport = async () => {
    if (!personalDetails.name || !personalDetails.email) {
      toast({
        title: "Missing Information",
        description: "Please enter at least your name and email before generating a report.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const aiInput = {
        name: personalDetails.name,
        netWorth,
        monthlyCashflow,
        insuranceCover: totalInsuranceCover,
        insurancePremium: totalInsurancePremium,
        goals: goalsWithSip.map(g => ({
          goalName: g.name,
          corpus: getNumericValue(g.corpus),
          years: getNumericValue(g.years),
          rate: getNumericValue(g.rate),
          sip: g.sip,
        })),
      };
      
      const { summary } = await summarizeFinancialStatus(aiInput);

      setReportData({
        personalDetails,
        netWorth,
        monthlyCashflow,
        totalInsuranceCover,
        totalInsurancePremium,
        goals: goalsWithSip,
        totalAssets,
        totalLiabilities,
        assets,
        liabilities,
        totalAnnualIncome,
        totalAnnualExpenses,
        expenses,
        aiSummary: summary,
      });

    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate AI summary. Please try again.",
        variant: "destructive",
      });
      setReportData({
        personalDetails,
        netWorth,
        monthlyCashflow,
        totalInsuranceCover,
        totalInsurancePremium,
        goals: goalsWithSip,
        totalAssets,
        totalLiabilities,
        assets,
        liabilities,
        totalAnnualIncome,
        totalAnnualExpenses,
        expenses,
        aiSummary: 'Could not generate AI summary at this time.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-4 md:p-8">
        <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-foreground">Plan Your Financial Future</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Fill in the details below to get a comprehensive overview of your financial health and a personalized plan to achieve your goals.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          <PersonalDetailsForm details={personalDetails} setDetails={setPersonalDetails} />
          <AssetsLiabilitiesForm 
            assets={assets} 
            setAssets={setAssets} 
            liabilities={liabilities} 
            setLiabilities={setLiabilities}
            netWorth={netWorth}
          />
          <IncomeExpensesForm
            incomes={incomes}
            setIncomes={setIncomes}
            expenses={expenses}
            setExpenses={setExpenses}
            yearlyCashflow={yearlyCashflow}
          />
          <InsuranceForm
            age={age}
            totalAnnualIncome={totalAnnualIncome}
          />
          <GoalsForm
            goals={goals}
            setGoals={setGoals}
            goalsWithSip={goalsWithSip}
          />
        </div>

        <div className="mt-12 text-center">
          <Button onClick={handleGenerateReport} disabled={isGenerating} size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Report
              </>
            ) : "Generate Financial Report"}
          </Button>
        </div>

        {reportData && (
          <div className="mt-12">
            <Report data={reportData} />
          </div>
        )}
      </div>
       <footer className="text-center p-4 text-muted-foreground text-sm border-t mt-12">
        &copy; {new Date().getFullYear()} FinFriend Planner. All rights reserved.
      </footer>
    </div>
  );
}
