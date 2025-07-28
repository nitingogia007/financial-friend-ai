
"use client";

import { useState, useEffect, useMemo } from 'react';
import { summarizeFinancialStatus } from '@/ai/flows/financial-status-summary';
import type { Asset, Liability, Income, Expense, Insurance, Goal, PersonalDetails, ReportData, GoalWithSip, GoalWithCalculations, SipOptimizerReportData } from '@/lib/types';
import { calculateSip, calculateAge, calculateGoalDetails, calculateTimelines } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

import { Header } from './Header';
import { PersonalDetailsForm } from './PersonalDetailsForm';
import { AssetsLiabilitiesForm } from './AssetsLiabilitiesForm';
import { IncomeExpensesForm } from './IncomeExpensesForm';
import { InsuranceForm } from './InsuranceForm';
import { GoalsForm } from './GoalsForm';
import { SipOptimizerReport } from './SipOptimizerReport';

export function Planner() {
  const { toast } = useToast();

  const [personalDetails, setPersonalDetails] = useState<PersonalDetails>({ name: 'John Doe', dob: '1990-05-15', dependents: 2, retirementAge: 60, mobile: '9876543210', email: 'john.doe@example.com', arn: 'ARN-12345' });
  const [assets, setAssets] = useState<Asset[]>([
      { id: '1', type: 'Stocks', amount: 500000 },
      { id: '2', type: 'Mutual Fund', amount: 1000000 },
      { id: '3', type: 'Gold', amount: 200000 },
      { id: '4', type: 'Fixed Deposit', amount: 300000 },
  ]);
  const [liabilities, setLiabilities] = useState<Liability[]>([{ id: '1', type: 'Home Loan', amount: 2500000 }]);
  const [incomes, setIncomes] = useState<Income[]>([{ id: '1', source: 'Salary', amount: 1800000 }]);
  const [expenses, setExpenses] = useState<Expense[]>([
      { id: '1', type: 'Rent', amount: 360000 },
      { id: '2', type: 'Groceries', amount: 120000 },
      { id: '3', type: 'Utilities', amount: 60000 },
  ]);
  const [goals, setGoals] = useState<Goal[]>([{ id: '1', name: 'Retirement', corpus: 20000000, years: 25, rate: 12, currentSave: 1000000, currentSip: 15000 }]);
  
  const [reportData, setReportData] = useState<SipOptimizerReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const getNumericValue = (val: number | '') => typeof val === 'number' ? val : 0;

  const age = useMemo(() => calculateAge(personalDetails.dob), [personalDetails.dob]);

  const totalAssets = useMemo(() => assets.reduce((sum, a) => sum + getNumericValue(a.amount), 0), [assets]);
  const totalLiabilities = useMemo(() => liabilities.reduce((sum, l) => sum + getNumericValue(l.amount), 0), [liabilities]);
  
  const totalAnnualIncome = useMemo(() => incomes.reduce((sum, i) => sum + getNumericValue(i.amount), 0), [incomes]);
  const totalAnnualExpenses = useMemo(() => expenses.reduce((sum, e) => sum + getNumericValue(e.amount), 0), [expenses]);
  const yearlyCashflow = useMemo(() => totalAnnualIncome - totalAnnualExpenses, [totalAnnualIncome, totalAnnualExpenses]);

  const goalsWithCalculations = useMemo<GoalWithCalculations[]>(() => goals.map(g => calculateGoalDetails(g)), [goals]);

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
      const primaryGoal = goalsWithCalculations[0];
      const investibleSurplus = (totalAnnualIncome - totalAnnualExpenses) / 12;
      
      const timelines = calculateTimelines(primaryGoal);

      const generatedReportData: SipOptimizerReportData = {
          personalDetails: {
              ...personalDetails,
              name: personalDetails.name || "N/A",
              dob: personalDetails.dob || "N/A",
              dependents: personalDetails.dependents || 0,
              retirementAge: personalDetails.retirementAge || "N/A",
              mobile: personalDetails.mobile || "N/A",
              email: personalDetails.email || "N/A",
              arn: personalDetails.arn || "N/A",
          },
          cashflow: {
              totalMonthlyIncome: totalAnnualIncome / 12,
              totalMonthlyExpenses: totalAnnualExpenses / 12,
              investibleSurplus: investibleSurplus,
          },
          investmentStatus: {
              currentInvestment: getNumericValue(primaryGoal.currentSip),
              requiredInvestment: primaryGoal.newSipRequired,
              potentialInvestment: investibleSurplus,
          },
          primaryGoal: {
              name: primaryGoal.name,
              targetCorpus: getNumericValue(primaryGoal.corpus),
              futureValue: primaryGoal.futureValueOfGoal,
              timeline: {
                  current: timelines.timelineWithCurrentSip,
                  required: timelines.timelineWithRequiredSip,
                  potential: timelines.timelineWithPotentialSip,
              },
          },
          detailedTables: {
              incomeExpenses: {
                  totalMonthlyIncome: totalAnnualIncome / 12,
                  fixedExpenses: expenses.filter(e => e.type === 'Rent').reduce((sum, e) => sum + getNumericValue(e.amount), 0) / 12,
                  emiExpenses: liabilities.filter(l => l.type.includes('Loan')).reduce((sum, l) => sum + (getNumericValue(l.amount) * 0.01), 0) / 12, // Simplified EMI
                  otherExpenses: expenses.filter(e => e.type !== 'Rent').reduce((sum, e) => sum + getNumericValue(e.amount), 0) / 12,
              },
              assetAllocation: {
                  mutualFunds: { corpus: assets.find(a=>a.type==='Mutual Fund')?.amount || 0, monthly: 0},
                  gold: { corpus: assets.find(a=>a.type==='Gold')?.amount || 0, monthly: 0},
                  stocks: { corpus: assets.find(a=>a.type==='Stocks')?.amount || 0, monthly: 0},
                  fixedDeposits: { corpus: assets.find(a=>a.type==='Fixed Deposit')?.amount || 0, monthly: 0},
              }
          },
          advisorDetails: {
            companyName: 'Financial Friend',
            arnName: personalDetails.name,
            arnNo: personalDetails.arn,
            mobile: personalDetails.mobile,
            email: personalDetails.email
          }
      };

      setReportData(generatedReportData);

    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please check the console for details.",
        variant: "destructive",
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
            netWorth={totalAssets - totalLiabilities}
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
            goalsWithCalculations={goalsWithCalculations}
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
            <SipOptimizerReport data={reportData} />
          </div>
        )}
      </div>
       <footer className="text-center p-4 text-muted-foreground text-sm border-t mt-12">
        &copy; {new Date().getFullYear()} FinFriend Planner. All rights reserved.
      </footer>
    </div>
  );
}
