
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
}

export interface Liability {
  id: string;
  type: string;
  amount: number | '';
}

export interface Income {
  id: string;
  source: string;
  amount: number | '';
}

export interface Expense {
  id: string;
  type: string;
  amount: number | '';
}

export interface Insurance {
  id: string;
  type: 'Life' | 'Health' | '';
  cover: number | '';
  premium: number | '';
}

export interface Goal {
  id: string;
  name: string;
  corpus: number | '';
  years: number | '';
  rate: number | '';
  currentSave: number | '';
  currentSip: number | '';
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
}
