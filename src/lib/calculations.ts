
import type { Goal, GoalWithCalculations } from './types';

// This function is kept for the AI summary, but detailed calculations are now separate.
export function calculateSip(goal: Goal): number {
  const corpus = typeof goal.corpus === 'number' ? goal.corpus : 0;
  const years = typeof goal.years === 'number' ? goal.years : 0;
  const rate = typeof goal.rate === 'number' ? goal.rate : 0;

  if (corpus <= 0 || years <= 0 || rate <= 0) {
    return 0;
  }

  const monthlyRate = rate / 100 / 12;
  const months = years * 12;
  
  // Required SIP = Future Value * (r / ((1+r)^n - 1))
  const sip = corpus * (monthlyRate / (Math.pow(1 + monthlyRate, months) - 1));

  return Math.round(sip);
}

export function calculateAge(dob: string): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
  }
  return age;
}


export function calculateGoalDetails(goal: Goal): GoalWithCalculations {
  const getNum = (val: number | '') => (typeof val === 'number' && !isNaN(val) ? val : 0);

  const corpus = getNum(goal.corpus);
  const years = getNum(goal.years);
  const rate = getNum(goal.rate);
  const currentSave = getNum(goal.currentSave);
  const currentSip = getNum(goal.currentSip);

  const inflationRate = 0.06;
  const monthlyRate = rate / 100 / 12;
  const months = years * 12;

  // 1. Future Value of Goal (FV of Corpus)
  const futureValueOfGoal = corpus * Math.pow(1 + inflationRate, years);

  // 2. FV of current save for goal
  const futureValueOfCurrentSave = currentSave * Math.pow(1 + rate / 100, years);
  
  // 3. FV of monthly SIP (annuity due formula)
  let futureValueOfSip = 0;
  if (monthlyRate > 0) {
    futureValueOfSip = currentSip * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
  } else {
    futureValueOfSip = currentSip * months;
  }

  // 4. Total projected value
  const totalFutureValue = futureValueOfCurrentSave + futureValueOfSip;

  // 5. Shortfall/Surplus calculation
  const shortfall = futureValueOfGoal - totalFutureValue;

  // 6. SIP required for the shortfall
  let newSipRequired = 0;
  if (shortfall > 0) {
    if (monthlyRate > 0) {
       newSipRequired = shortfall / (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
    } else if (months > 0) {
      newSipRequired = shortfall / months;
    }
  }
  
  return {
    ...goal,
    futureValueOfGoal: futureValueOfGoal,
    futureValueOfCurrentSave: futureValueOfCurrentSave,
    futureValueOfSip: futureValueOfSip,
    totalFutureValue: totalFutureValue,
    shortfall: shortfall,
    newSipRequired: newSipRequired,
  };
}
