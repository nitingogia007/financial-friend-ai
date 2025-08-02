

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
        potentialInvestment: number;
        allocatedInvestment: number;
    };
}

export interface WealthCreationGoal {
    sip: number;
    years: number;
    projectedCorpus: number;
}

export interface InsuranceAnalysisData {
    lifeInsurance: {
        recommendedCover: number;
        currentPremium: number | '';
        coverageGap: number;
    };
    healthInsurance: {
        recommendedCover: string;
        currentPremium: number | '';
        coverageGap: number;
    };
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
        mutualFunds: { corpus: number | '', monthly: number | '' };
        gold: { corpus: number | '', monthly: number | '' };
        stocks: { corpus: number | '', monthly: number | '' };
        fixedDeposits: { corpus: number | '', monthly: number | '' };
        others: { corpus: number, monthly: number };
        total: { corpus: number, monthly: number };
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
}

    
