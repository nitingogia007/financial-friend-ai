

export interface PersonalDetails {
  name: string;
  dob: string;
  dependents: number | '';
  retirementAge: number | '';
  mobile: string;
  email: string;
  arn: string;
}

export interface Asset {
  id: string;
  type: string;
  amount: number | '';
  otherType?: string;
}

export interface Liability {
  id: string;
  type: string;
  amount: number | '';
  otherType?: string;
}

export interface Income {
  id: string;
  source: string;
  amount: number | '';
  otherType?: string;
}

export interface Expense {
  id: string;
  type: string;
  amount: number | '';
  otherType?: string;
}

export interface Insurance {
  id: string;
  type: 'Life' | 'Health' | '';
  cover: number | '';
  premium: number | '';
}

export interface Goal {
  id:string;
  name: string;
  corpus: number | '';
  years: number | '';
  rate: number | '';
  currentSave: number | '';
  currentSip: number | '';
  otherType?: string;
}

export interface GoalWithSip extends Goal {
  sip: number;
}

export interface GoalWithCalculations extends Goal {
  futureValueOfGoal: number;
  futureValueOfCurrentSave: number;
  futureValueOfSip: number;
  totalFutureValue: number;
  shortfall: number;
  newSipRequired: number;
}


export interface ReportData {
  personalDetails: PersonalDetails;
  netWorth: number;
  monthlyCashflow: number;
  totalInsuranceCover: number;
  totalInsurancePremium: number;
  goals: GoalWithSip[];
  totalAssets: number;
  totalLiabilities: number;
  assets: Asset[];
  liabilities: Liability[];
  totalAnnualIncome: number;
  totalAnnualExpenses: number;
  expenses: Expense[];
  aiSummary: string;
  willStatus: 'yes' | 'no' | null;
}


// Types for the SIP Optimizer Report

export interface SipOptimizerGoal {
    id: string;
    name: string;
    targetCorpus: number;
    futureValue: number;
    timeline: {
        current: number;
        required: number;
        potential: number;
    };
    investmentStatus: {
        currentInvestment: number;
        requiredInvestment: number;
        allocatedInvestment: number;
    };
    potentialCorpus: number;
}

export interface RetirementGoalReport {
    futureValue: number;
    timeline: {
        current: number;
        required: number;
        potential: number;
    };
    investmentStatus: {
        currentInvestment: number;
        requiredInvestment: number;
        allocatedInvestment: number;
    };
    potentialCorpus: number;
}


export interface WealthCreationGoal {
    sip: number;
    years: number;
    projectedCorpus: number;
}

export interface LifeInsuranceQuote {
    planName: string;
    premiumAmount: number | '';
    premiumPaymentTerm: string;
    policyTerm: string;
    coverAmount: number | '';
}

export interface HealthInsuranceQuote {
    company: string;
    planName: string;
    premium1Y: number | '';
    sumAssured: string;
    preHospitalization: 'Covered' | 'Not Covered' | '';
    postHospitalization: 'Covered' | 'Not Covered' | '';
    waitingPeriodPED: 'Covered' | 'Not Covered' | '';
    roomRent: 'No cap' | 'Optional cap' | 'Private room' | 'Single private room' | 'All Types of Rooms' | '';
    restoreBenefit: '(Full SI)' | '(Once)' | '(Unlimited)' | '(Unlimited for same/different illness)' | '';
    ambulanceRoad: 'Included' | 'Excluded' | '';
    ambulanceAir: 'Optional' | 'Included' | 'Excluded' | '';
    healthCheckup: 'Covered' | 'Not Covered' | '';
    eConsultation: 'Included' | 'Not included' | '';
}


export interface InsuranceAnalysisData {
    lifeInsurance: {
        recommendedCover: number;
        currentCover: number | '';
        currentPremium?: number | '';
        coverageGap: number;
        quote?: LifeInsuranceQuote;
    };
    healthInsurance: {
        recommendedCover: string;
        currentCover: number | '';
        currentPremium?: number | '';
        coverageGap: number;
        quote?: HealthInsuranceQuote;
    };
}

export type RiskAppetite = 'High Aggressive' | 'High' | 'Moderate' | 'Conservative' | '';

export interface AssetAllocationProfile {
    age: number | '';
    riskAppetite: RiskAppetite;
}

export interface SipOptimizerReportData {
  personalDetails: {
    name: string;
    dob: string;
    dependents: number | '';
    retirementAge: number | '';
    mobile: string;
    email: string;
    arn: string;
  };
  netWorth: number;
  cashflow: {
    totalMonthlyIncome: number;
    totalMonthlyExpenses: number;
    investibleSurplus: number;
  };
  goals: SipOptimizerGoal[];
  retirementGoal: RetirementGoalReport | null;
  wealthCreationGoal: WealthCreationGoal | null;
  totalInvestmentStatus: {
    currentInvestment: number;
    requiredInvestment: number;
    potentialInvestment: number;
  };
  detailedTables: {
    incomeExpenses: {
        totalMonthlyIncome: number;
        fixedExpenses: number;
        emiExpenses: number;
        otherExpenses: number;
    };
    assetAllocation: {
        equity: { corpus: number; monthly: number };
        fixedIncome: { corpus: number; monthly: number };
        ppf: { corpus: number; monthly: number };
        epf: { corpus: number; monthly: number };
        nps: { corpus: number; monthly: number };
        gold: { corpus: number; monthly: number };
        insurance: { corpus: number; monthly: number };
        realEstate: { corpus: number; monthly: number };
        others: { corpus: number; monthly: number };
        total: { corpus: number; monthly: number };
    };
  };
  advisorDetails: {
    arnName: string;
    arnNo: string;
    mobile: string;
    email: string;
  };
  insuranceAnalysis: InsuranceAnalysisData;
  assets: Asset[];
  willStatus: 'yes' | 'no' | null;
  retirementCalculations: RetirementCalculations;
  assetAllocationProfile: AssetAllocationProfile;
  recommendedFunds: { [key: string]: string };
}

export interface RetirementInputs {
    currentAge: number | '';
    desiredRetirementAge: number | '';
    lifeExpectancy: number | '';
    currentMonthlyExpense: number | '';
    preRetirementRoi: number | '';
    postRetirementRoi: number | '';
    incrementalRate: number | '';
    currentSavings: number | '';
    currentSip: number | '';
}

export interface RetirementCalculations {
    expectedInflationRate: number;
    realRateOfReturn: number;
    yearsToRetirement: number;
    yearsInRetirement: number;
    inflatedMonthlyExpense: number;
    annualExpenseAtRetirement: number;
    requiredRetirementCorpus: number;
    monthlyInvestmentNeeded: number;
    incrementalMonthlyInvestment: number;
}
