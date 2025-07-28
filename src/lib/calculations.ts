import type { Goal } from './types';

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
