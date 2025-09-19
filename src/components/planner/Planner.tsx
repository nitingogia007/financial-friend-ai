
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { summarizeFinancialStatus } from '@/ai/flows/financial-status-summary';
import type { PersonalDetails, Asset, Liability, Income, Expense, Goal, GoalWithCalculations, SipOptimizerReportData, GoalWithSip, SipOptimizerGoal, InsuranceAnalysisData, WealthCreationGoal, ReportData, RetirementInputs, RetirementCalculations, AssetAllocationProfile, RetirementGoalReport } from '@/lib/types';
import { calculateAge, calculateGoalDetails, calculateTimelines, calculateSip, calculateWealthCreation, calculateFutureValue, calculateRetirementDetails, calculateNper } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download } from 'lucide-react';
import { generateCsv } from '@/lib/csv';

import { PersonalDetailsForm } from './PersonalDetailsForm';
import { AssetsLiabilitiesForm } from './AssetsLiabilitiesForm';
import { IncomeExpensesForm } from './IncomeExpensesForm';
import { InsuranceForm } from './InsuranceForm';
import { GoalsForm } from './GoalsForm';
import { EstatePlanningForm } from './EstatePlanningForm';
import { RetirementPlannerForm } from './RetirementPlannerForm';
import { AssetAllocationForm } from './AssetAllocationForm';
import { RecommendedFunds } from './RecommendedFunds';
import { recommendedFunds as defaultRecommendedFunds } from '@/lib/calculations';


export function Planner() {
  const { toast } = useToast();
  const router = useRouter();
  
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [personalDetails, setPersonalDetails] = useState<PersonalDetails>({ name: '', dob: '', dependents: '', retirementAge: '', mobile: '', email: '', arn: '' });
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<Goal[]>([{ id: 'initial-1', name: '', corpus: '', years: '', rate: 12, currentSave: '', currentSip: '' }]);
  const [insuranceAnalysis, setInsuranceAnalysis] = useState<InsuranceAnalysisData | null>(null);
  const [willStatus, setWillStatus] = useState<'yes' | 'no' | null>(null);
  const [retirementInputs, setRetirementInputs] = useState<RetirementInputs>({
    currentAge: '',
    desiredRetirementAge: '',
    lifeExpectancy: '',
    currentMonthlyExpense: '',
    preRetirementRoi: '',
    postRetirementRoi: '',
    incrementalRate: '',
    currentSavings: '',
    currentSip: '',
  });
  const [assetAllocationProfile, setAssetAllocationProfile] = useState<AssetAllocationProfile>({ age: '', riskAppetite: '' });
  const [recommendedFunds, setRecommendedFunds] = useState<{[key: string]: string}>(
    Object.keys(defaultRecommendedFunds).reduce((acc, key) => ({...acc, [key]: ''}), {})
  );

  
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
  const retirementCalculations = useMemo<RetirementCalculations>(() => calculateRetirementDetails(retirementInputs), [retirementInputs]);

  const handleDownloadCsv = () => {
    const allData = {
        personalDetails,
        assets,
        liabilities,
        incomes,
        expenses,
        goals,
        insuranceAnalysis,
        willStatus,
        retirementInputs,
        assetAllocationProfile,
        recommendedFunds,
        netWorth,
        yearlyCashflow
    };
    generateCsv(allData);
  };


  const handleGenerateReport = async () => {
    if (!personalDetails.name || !personalDetails.email) {
      toast({
        title: "Missing Information",
        description: "Please enter at least your name and email before generating a report.",
        variant: "destructive",
      });
      return;
    }
     if (goals.length === 0 || goals.every(g => !g.name)) {
      toast({
        title: "No Goals",
        description: "Please add at least one financial goal.",
        variant: "destructive"
      });
      return;
    }
    if (!insuranceAnalysis) {
      toast({
        title: "Insurance Data Missing",
        description: "Could not retrieve insurance analysis data. Please fill out the insurance section.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Prepare data with user-specified "Other" values
      const processedAssets: Asset[] = assets.map(a => ({ ...a, type: a.type === 'Other' && a.otherType ? a.otherType : a.type }));
      const processedLiabilities: Liability[] = liabilities.map(l => ({ ...l, type: l.type === 'Other' && l.otherType ? l.otherType : l.type }));
      const processedExpenses: Expense[] = expenses.map(e => ({ ...e, type: e.type === 'Other' && e.otherType ? e.otherType : e.type }));
      const processedGoals: Goal[] = goals.map(g => ({ ...g, name: g.name === 'Other' && g.otherType ? g.otherType : g.name }));
      const processedGoalsWithCalculations: GoalWithCalculations[] = goalsWithCalculations.map((g, i) => ({ 
        ...g, 
        name: processedGoals[i].name 
      }));


      // Common data preparation
      const monthlyCashflow = (totalAnnualIncome - totalAnnualExpenses) / 12;
      let investibleSurplus = monthlyCashflow > 0 ? monthlyCashflow : 0;
      
      const findAssetAmount = (type: string) => getNumericValue(processedAssets.find(a=> a.type === type)?.amount);
      const assetAllocation = {
          equity: { corpus: findAssetAmount('Indian Equity shares'), monthly: processedGoals.reduce((sum, g) => sum + getNumericValue(g.currentSip), 0) },
          fixedIncome: { corpus: findAssetAmount('Fixed Income instruments'), monthly: 0},
          ppf: { corpus: findAssetAmount('PPF'), monthly: 0},
          epf: { corpus: findAssetAmount('EPF'), monthly: 0},
          nps: { corpus: findAssetAmount('NPS'), monthly: 0},
          gold: { corpus: findAssetAmount('Gold/Gold Bond/ETF/Fund'), monthly: 0},
          insurance: { corpus: findAssetAmount('Insurance'), monthly: 0},
          realEstate: { corpus: findAssetAmount('Real Estate'), monthly: 0},
          others: { corpus: findAssetAmount('Other'), monthly: 0}, // Note: This might need adjustment if multiple 'Other' assets exist
          total: { corpus: 0, monthly: 0 }
      };

      assetAllocation.total.corpus = Object.values(assetAllocation).reduce((sum, val) => sum + (val.corpus || 0), 0) - assetAllocation.total.corpus;
      assetAllocation.total.monthly = Object.values(assetAllocation).reduce((sum, val) => sum + (val.monthly || 0), 0) - assetAllocation.total.monthly;

      // New Retirement Goal Logic
      let retirementGoalReport: RetirementGoalReport | null = null;
      const retirementRequiredSip = retirementCalculations.monthlyInvestmentNeeded;

      if (retirementRequiredSip > 0) {
          const currentRetirementSip = getNumericValue(retirementInputs.currentSip);
          let allocatedRetirementSip = 0;

          if (investibleSurplus >= retirementRequiredSip) {
              allocatedRetirementSip = retirementRequiredSip;
              investibleSurplus -= retirementRequiredSip;
          } else {
              allocatedRetirementSip = investibleSurplus;
              investibleSurplus = 0;
          }

          const potentialRetirementCorpus = calculateFutureValue(
              allocatedRetirementSip,
              getNumericValue(retirementInputs.preRetirementRoi),
              retirementCalculations.yearsToRetirement,
              getNumericValue(retirementInputs.currentSavings)
          );

          const targetCorpusForTimeline = retirementCalculations.requiredRetirementCorpus;
          const preRetirementRoiForTimeline = getNumericValue(retirementInputs.preRetirementRoi);
          
          const totalCurrentRetirementAssets = getNumericValue(retirementInputs.currentSavings) + calculateFutureValue(getNumericValue(retirementInputs.currentSip), getNumericValue(retirementInputs.preRetirementRoi), retirementCalculations.yearsToRetirement, 0);

          let potentialTimeline;
          if (allocatedRetirementSip >= retirementRequiredSip) {
              potentialTimeline = retirementCalculations.yearsToRetirement;
          } else {
              potentialTimeline = calculateNper(
                  targetCorpusForTimeline,
                  preRetirementRoiForTimeline,
                  allocatedRetirementSip,
                  getNumericValue(retirementInputs.currentSavings) + calculateFutureValue(0, preRetirementRoiForTimeline, retirementCalculations.yearsToRetirement, getNumericValue(retirementInputs.currentSip)) // This seems off
              );
          }
          
          const currentTimeline = calculateNper(
              targetCorpusForTimeline,
              preRetirementRoiForTimeline,
              currentRetirementSip,
              getNumericValue(retirementInputs.currentSavings)
          );


          retirementGoalReport = {
              futureValue: retirementCalculations.requiredRetirementCorpus,
              timeline: {
                current: currentTimeline,
                required: retirementCalculations.yearsToRetirement,
                potential: potentialTimeline,
              },
              investmentStatus: {
                  currentInvestment: currentRetirementSip,
                  requiredInvestment: retirementRequiredSip,
                  allocatedInvestment: allocatedRetirementSip,
              },
              potentialCorpus: potentialRetirementCorpus,
          };
      }


      // SIP Optimizer Logic for other goals
      const totalRequiredSipForOtherGoals = processedGoalsWithCalculations.reduce((sum, goal) => sum + goal.newSipRequired, 0);
      let surplusForWealthCreation = 0;
      let optimizerGoals: SipOptimizerGoal[] = [];

      if (investibleSurplus >= totalRequiredSipForOtherGoals) {
        // CASE 1 & 3: All goals are covered, potentially with surplus
        surplusForWealthCreation = investibleSurplus - totalRequiredSipForOtherGoals;
        optimizerGoals = processedGoalsWithCalculations.map(goal => {
            const timelines = calculateTimelines(goal, goal.newSipRequired);
            return {
                id: goal.id,
                name: goal.name,
                targetCorpus: getNumericValue(goal.corpus),
                futureValue: goal.futureValueOfGoal,
                timeline: {
                    current: timelines.timelineWithCurrentSip,
                    required: timelines.timelineWithRequiredSip,
                    potential: timelines.timelineWithRequiredSip, // Same as required because surplus goes to wealth creation
                },
                investmentStatus: {
                    currentInvestment: getNumericValue(goal.currentSip),
                    requiredInvestment: goal.newSipRequired,
                    allocatedInvestment: goal.newSipRequired, // Fund exactly what's required
                },
                potentialCorpus: goal.futureValueOfGoal, // It's achievable
            };
        });
      } else {
        // CASE 2: SIPs exceed cashflow, allocate proportionally based on required SIP ratio
        optimizerGoals = processedGoalsWithCalculations.map(goal => {
            let allocatedInvestment = 0;
            if (processedGoalsWithCalculations.length === 1) {
                allocatedInvestment = investibleSurplus;
            } else if (totalRequiredSipForOtherGoals > 0) {
                const weight = goal.newSipRequired / totalRequiredSipForOtherGoals;
                allocatedInvestment = investibleSurplus * weight;
            }
            
            // Recalculate potential corpus based on the allocated SIP and ORIGINAL timeline
            const potentialCorpus = calculateFutureValue(allocatedInvestment, getNumericValue(goal.rate), getNumericValue(goal.years), getNumericValue(goal.currentSave));
            const timelines = calculateTimelines(goal, allocatedInvestment);
            
            return {
                id: goal.id,
                name: goal.name,
                targetCorpus: getNumericValue(goal.corpus),
                futureValue: goal.futureValueOfGoal,
                timeline: {
                    current: timelines.timelineWithCurrentSip,
                    required: timelines.timelineWithRequiredSip,
                    potential: timelines.timelineWithPotentialSip, // Use recalculated timeline
                },
                investmentStatus: {
                    currentInvestment: getNumericValue(goal.currentSip),
                    requiredInvestment: goal.newSipRequired,
                    allocatedInvestment: allocatedInvestment,
                },
                potentialCorpus: goal.futureValueOfGoal, // Keep the target corpus constant
            };
        });
      }
      
      let wealthCreationGoal: WealthCreationGoal | null = null;
      if (surplusForWealthCreation > 0) {
          const defaultRate = processedGoals.length > 0 ? (processedGoals.reduce((acc, g) => acc + getNumericValue(g.rate), 0) / processedGoals.length) : 12;
          wealthCreationGoal = calculateWealthCreation(surplusForWealthCreation, defaultRate);
      }
      
      const totalCurrentInvestment = optimizerGoals.reduce((sum, g) => sum + g.investmentStatus.currentInvestment, 0) + (retirementGoalReport?.investmentStatus.currentInvestment || 0) + getNumericValue(retirementInputs.currentSip);
      const totalRequiredInvestment = totalRequiredSipForOtherGoals + (retirementGoalReport?.investmentStatus.requiredInvestment || 0);
      const totalPotentialInvestment = (monthlyCashflow > 0 ? monthlyCashflow : 0);

       const totalInvestmentStatus = {
          currentInvestment: totalCurrentInvestment,
          requiredInvestment: totalRequiredInvestment,
          potentialInvestment: totalPotentialInvestment,
      };

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
              investibleSurplus: (monthlyCashflow > 0 ? monthlyCashflow : 0),
          },
          goals: optimizerGoals,
          retirementGoal: retirementGoalReport,
          wealthCreationGoal: wealthCreationGoal,
          totalInvestmentStatus,
          detailedTables: {
              incomeExpenses: {
                  totalMonthlyIncome: totalAnnualIncome / 12,
                  fixedExpenses: processedExpenses.filter(e => e.type === 'Rent').reduce((sum, e) => sum + getNumericValue(e.amount), 0) / 12,
                  emiExpenses: 0, // Placeholder
                  otherExpenses: processedExpenses.filter(e => e.type !== 'Rent').reduce((sum, e) => sum + getNumericValue(e.amount), 0) / 12,
              },
              assetAllocation: assetAllocation
          },
          advisorDetails: {
            arnName: 'Gunjan Kataria',
            arnNo: personalDetails.arn || 'ARN-157982',
            mobile: '9460825477',
            email: 'contact@financialfriend.in',
          },
          insuranceAnalysis: insuranceAnalysis,
          assets: processedAssets,
          willStatus: willStatus,
          retirementCalculations: retirementCalculations,
          assetAllocationProfile: assetAllocationProfile,
          recommendedFunds,
      };
      
      // Detailed Wellness Report Data
      const goalsWithSip: GoalWithSip[] = processedGoals.map(g => ({
        ...g,
        sip: calculateSip(g)
      }));

       const summaryInput = {
        name: personalDetails.name || "User",
        netWorth,
        monthlyCashflow,
        insuranceCover: getNumericValue(insuranceAnalysis.lifeInsurance.currentCover) + getNumericValue(insuranceAnalysis.healthInsurance.currentCover),
        insurancePremium: getNumericValue(insuranceAnalysis.lifeInsurance.currentPremium) + getNumericValue(insuranceAnalysis.healthInsurance.currentPremium),
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
        assets: processedAssets,
        liabilities: processedLiabilities,
        totalAnnualIncome: totalAnnualIncome,
        totalAnnualExpenses: totalAnnualExpenses,
        expenses: processedExpenses,
        aiSummary: summary,
        willStatus: willStatus,
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

  if (!isMounted) {
    return null; // or a loading spinner
  }

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
            onInsuranceDataChange={setInsuranceAnalysis}
          />
          <GoalsForm
            goals={goals}
            setGoals={setGoals}
            goalsWithCalculations={goalsWithCalculations}
          />
           <RetirementPlannerForm
            inputs={retirementInputs}
            setInputs={setRetirementInputs}
            calculations={retirementCalculations}
          />
           <EstatePlanningForm
            willStatus={willStatus}
            setWillStatus={setWillStatus}
          />
          <AssetAllocationForm 
            profile={assetAllocationProfile}
            setProfile={setAssetAllocationProfile}
          />
          <RecommendedFunds
            funds={recommendedFunds}
            setFunds={setRecommendedFunds}
           />
        </div>

        <div className="mt-12 text-center flex justify-center items-center gap-4">
          <Button onClick={handleGenerateReport} disabled={isGenerating} size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Reports...
              </>
            ) : "Generate Financial Reports"}
          </Button>
           <Button onClick={handleDownloadCsv} variant="outline" size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
              <Download className="mr-2 h-5 w-5" /> Download as CSV
          </Button>
        </div>

      </div>
       <footer className="text-center p-4 text-muted-foreground text-sm border-t mt-12">
        &copy; {new Date().getFullYear()} FinFriend Planner. All rights reserved.
      </footer>
    </div>
  );
}
