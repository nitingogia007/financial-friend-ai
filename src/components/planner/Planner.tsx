

"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { summarizeFinancialStatus } from '@/ai/flows/financial-status-summary';
import type { PersonalDetails, Asset, Liability, Income, Expense, Goal, GoalWithCalculations, SipOptimizerReportData, ReportData, GoalWithSip } from '@/lib/types';
import { calculateAge, calculateGoalDetails, calculateTimelines, calculateSip } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

import { PersonalDetailsForm } from './PersonalDetailsForm';
import { AssetsLiabilitiesForm } from './AssetsLiabilitiesForm';
import { IncomeExpensesForm } from './IncomeExpensesForm';
import { InsuranceForm } from './InsuranceForm';
import { GoalsForm } from './GoalsForm';

export function Planner() {
  const { toast } = useToast();
  const router = useRouter();

  const [personalDetails, setPersonalDetails] = useState<PersonalDetails>({ name: '', dob: '', dependents: '', retirementAge: '', mobile: '', email: '', arn: '' });
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  
  const [isGenerating, setIsGenerating] = useState(false);

  const getNumericValue = (val: number | '') => typeof val === 'number' ? val : 0;

  const age = useMemo(() => calculateAge(personalDetails.dob), [personalDetails.dob]);

  const totalAssets = useMemo(() => assets.reduce((sum, a) => sum + getNumericValue(a.amount), 0), [assets]);
  const totalLiabilities = useMemo(() => liabilities.reduce((sum, l) => sum + getNumericValue(l.amount), 0), [liabilities]);
  const netWorth = useMemo(() => totalAssets - totalLiabilities, [totalAssets, totalLiabilities]);
  
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
      // Common data preparation
      const monthlyCashflow = (totalAnnualIncome - totalAnnualExpenses) / 12;
      const primaryGoal = goalsWithCalculations[0] || { currentSip: 0, newSipRequired: 0, name: 'Primary Goal', corpus: 0, futureValueOfGoal: 0, years: 0, rate: 0, currentSave: 0, futureValueOfCurrentSave: 0 };
      const investibleSurplus = monthlyCashflow > 0 ? monthlyCashflow : 0;
      
      const timelines = calculateTimelines(primaryGoal, investibleSurplus);

      // SIP Optimizer Report Data
      const generatedSipReportData: SipOptimizerReportData = {
          personalDetails: {
              name: personalDetails.name || "N/A",
              dob: personalDetails.dob || "N/A",
              dependents: getNumericValue(personalDetails.dependents),
              retirementAge: getNumericValue(personalDetails.retirementAge),
              mobile: personalDetails.mobile || "N/A",
              email: personalDetails.email || "N/A",
              arn: personalDetails.arn || "N/A",
          },
          netWorth: netWorth,
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
                  emiExpenses: liabilities.filter(l => l.type.includes('Loan')).reduce((sum, l) => sum + (getNumericValue(l.amount) * 0.01), 0) / 12,
                  otherExpenses: expenses.filter(e => e.type !== 'Rent').reduce((sum, e) => sum + getNumericValue(e.amount), 0) / 12,
              },
              assetAllocation: {
                  mutualFunds: { corpus: getNumericValue(assets.find(a=>a.type==='Mutual Fund')?.amount), monthly: goals.reduce((sum, g) => sum + getNumericValue(g.currentSip), 0) },
                  gold: { corpus: getNumericValue(assets.find(a=>a.type==='Gold')?.amount), monthly: 0},
                  stocks: { corpus: getNumericValue(assets.find(a=>a.type==='Stocks')?.amount), monthly: 0},
                  fixedDeposits: { corpus: getNumericValue(assets.find(a=>a.type==='Bank')?.amount), monthly: 0},
              }
          },
          advisorDetails: {
            arnName: 'Gunjan Kataria',
            arnNo: personalDetails.arn || 'N/A',
            mobile: personalDetails.mobile || 'N/A',
            email: personalDetails.email || 'N/A',
          }
      };
      
      // Detailed Wellness Report Data
      const goalsWithSip: GoalWithSip[] = goals.map(g => ({
        ...g,
        sip: calculateSip(g)
      }));

       const summaryInput = {
        name: personalDetails.name || "User",
        netWorth,
        monthlyCashflow,
        insuranceCover: 0,
        insurancePremium: 0,
        goals: goalsWithSip.map(g => ({
          goalName: g.name,
          corpus: getNumericValue(g.corpus),
          years: getNumericValue(g.years),
          rate: getNumericValue(g.rate),
          sip: g.sip
        })),
      };

      const { summary } = await summarizeFinancialStatus(summaryInput);

      const generatedDetailedReportData: ReportData = {
        personalDetails: personalDetails,
        netWorth: netWorth,
        monthlyCashflow: monthlyCashflow,
        totalInsuranceCover: 0,
        totalInsurancePremium: 0,
        goals: goalsWithSip,
        totalAssets: totalAssets,
        totalLiabilities: totalLiabilities,
        assets: assets,
        liabilities: liabilities,
        totalAnnualIncome: totalAnnualIncome,
        totalAnnualExpenses: totalAnnualExpenses,
        expenses: expenses,
        aiSummary: summary,
      };

      // Store data in sessionStorage to pass to the next pages
      sessionStorage.setItem('sipOptimizerReportData', JSON.stringify(generatedSipReportData));
      sessionStorage.setItem('detailedReportData', JSON.stringify(generatedDetailedReportData));

      router.push('/sip-optimizer-report');

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
    <div className="bg-background">
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
            incomes={incomes}
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
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Reports...
              </>
            ) : "Generate Financial Reports"}
          </Button>
        </div>

      </div>
       <footer className="text-center p-4 text-muted-foreground text-sm border-t mt-12">
        &copy; {new Date().getFullYear()} FinFriend Planner. All rights reserved.
      </footer>
    </div>
  );
}
