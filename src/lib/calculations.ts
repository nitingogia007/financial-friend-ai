
import type { Goal, GoalWithCalculations } from './types';

export function calculateSip(goal: Goal): number {
    const getNum = (val: number | '') => (typeof val === 'number' && !isNaN(val) ? val : 0);
    const corpus = getNum(goal.corpus);
    const years = getNum(goal.years);
    const rate = getNum(goal.rate);

    if (corpus <= 0 || years <= 0 || rate <= 0) {
        return 0;
    }

    const inflationRate = 0.06;
    const futureValue = corpus * Math.pow(1 + inflationRate, years);

    const monthlyRate = rate / 100 / 12;
    const months = years * 12;

    if (monthlyRate === 0) {
        return months > 0 ? futureValue / months : 0;
    }

    const sip = futureValue / (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));

    return sip;
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

export function calculateTimelines(goal: GoalWithCalculations, potentialSip: number) {
    const getNum = (val: number | '' | undefined) => (typeof val === 'number' && !isNaN(val) ? val : 0);

    const futureValueGoal = goal.futureValueOfGoal;
    const rate = getNum(goal.rate) / 100;
    const currentSip = getNum(goal.currentSip);
    const requiredSip = goal.newSipRequired;
    
    const calculateYears = (monthlySip: number) => {
        if (monthlySip <= 0 || rate <= 0 || futureValueGoal <= 0) return Infinity;
        const monthlyRate = rate / 12;
        // Using the NPER formula from logs
        const numerator = Math.log((monthlySip / monthlyRate) + (goal.futureValueOfCurrentSave || 0));
        const denominator = Math.log(1 + monthlyRate);
        const fvNper = Math.log((futureValueGoal * monthlyRate + monthlySip) / (monthlySip));
        const finalNper = fvNper / Math.log(1+monthlyRate);

        let nper = Math.log(1 + (futureValueGoal * monthlyRate) / monthlySip) / Math.log(1 + monthlyRate);
        if (goal.futureValueOfCurrentSave > 0) {
            const fvOfSavings = goal.futureValueOfCurrentSave;
            const remainingFv = futureValueGoal - fvOfSavings;
            if (remainingFv <= 0) return 0; // Already reached
            nper = Math.log(1 + (remainingFv * monthlyRate) / monthlySip) / Math.log(1 + monthlyRate);
        }
        
        let years = nper / 12;
        
        // Simplified NPER when no savings
        const simpleNper = Math.log((futureValueGoal * monthlyRate) / monthlySip + 1) / Math.log(1 + monthlyRate);
        years = simpleNper / 12;


        return isFinite(years) ? Math.ceil(years) : Infinity;
    };

    return {
        timelineWithCurrentSip: calculateYears(currentSip),
        timelineWithRequiredSip: calculateYears(requiredSip),
        timelineWithPotentialSip: calculateYears(potentialSip),
    };
}
