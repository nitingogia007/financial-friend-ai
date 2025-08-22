
import type { Goal, GoalWithCalculations, WealthCreationGoal, RetirementInputs, RetirementCalculations } from './types';

// Financial formula implementations
function fv(rate: number, nper: number, pmt: number, pv: number, type: 0 | 1 = 0) {
    if (rate === 0) {
        return -(pv + pmt * nper);
    }
    const pow = Math.pow(1 + rate, nper);
    return -((pv * pow) + (pmt * (1 + rate * type) * (pow - 1) / rate));
}

function pv(rate: number, nper: number, pmt: number, fvVal: number, type: 0 | 1 = 0) {
    if (rate === 0) {
        return -(fvVal + pmt * nper);
    }
    const pow = Math.pow(1 + rate, nper);
    let pv_value = fvVal;
    if (pmt !== 0) {
        pv_value += pmt * (1 + rate * type) * ((pow - 1) / rate);
    }
    return -pv_value / pow;
}

function pmt(rate: number, nper: number, pv: number, fvVal: number, type: 0 | 1 = 0) {
    if (rate === 0) {
        return -(fvVal + pv) / nper;
    }
    const pow = Math.pow(1 + rate, nper);
    return -((fvVal + pv * pow) / ((1 + rate * type) * (pow - 1) / rate));
}


export function calculateSip(goal: Goal): number {
    const getNum = (val: number | '') => (typeof val === 'number' && !isNaN(val) ? val : 0);
    const corpus = getNum(goal.corpus);
    const years = getNum(goal.years);
    const rate = getNum(goal.rate);

    if (corpus <= 0 || years <= 0 || rate <= 0) {
        return 0;
    }

    const inflationRate = goal.name === 'Child Education' ? 0.10 : 0.06;
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

  const inflationRate = goal.name === 'Child Education' ? 0.10 : 0.06;
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
  const shortfall = futureValueOfGoal - futureValueOfCurrentSave;

  // 6. SIP required for the shortfall
  let newSipRequired = 0;
  if (shortfall > 0) {
    if (monthlyRate > 0 && months > 0) {
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
    shortfall: futureValueOfGoal - totalFutureValue, // Corrected shortfall
    newSipRequired: newSipRequired,
  };
}


export function calculateTimelines(goal: GoalWithCalculations, potentialSip: number) {
    const getNum = (val: number | '' | undefined) => (typeof val === 'number' && !isNaN(val) ? val : 0);

    const futureValueGoal = goal.futureValueOfGoal;
    const rate = getNum(goal.rate) / 100;
    const currentSip = getNum(goal.currentSip);
    const requiredSip = goal.newSipRequired;
    const futureValueOfCurrentSave = goal.futureValueOfCurrentSave;

    
    const calculateYears = (monthlySip: number) => {
        if (monthlySip <= 0) return Infinity;
        
        const targetCorpus = futureValueGoal - futureValueOfCurrentSave;
        if (targetCorpus <= 0) return 0; // Already met

        if (rate <= 0) {
            return (targetCorpus / (monthlySip * 12));
        }
        
        const monthlyRate = rate / 12;
        
        // NPER formula for annuity due: n = log( (FV*r + Pmt*(1+r)) / (Pmt*(1+r)) ) / log(1+r)
        const numerator = Math.log((targetCorpus * monthlyRate) / (monthlySip * (1 + monthlyRate)) + 1);
        const denominator = Math.log(1 + monthlyRate);
        
        if (denominator === 0) return Infinity;

        const nper = numerator / denominator;
        const years = nper / 12;

        return isFinite(years) ? years : Infinity;
    };

    return {
        timelineWithCurrentSip: calculateYears(currentSip),
        timelineWithRequiredSip: calculateYears(requiredSip),
        timelineWithPotentialSip: calculateYears(potentialSip),
    };
}


export function calculateWealthCreation(sip: number, rate: number): WealthCreationGoal {
    const years = 20; // Fixed 20-year horizon
    const monthlyRate = rate / 100 / 12;
    const months = years * 12;

    let projectedCorpus = 0;
    if (monthlyRate > 0) {
        projectedCorpus = sip * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    } else {
        projectedCorpus = sip * months;
    }

    return {
        sip,
        years,
        projectedCorpus,
    };
}

export function calculateFutureValue(monthlySip: number, annualRate: number, years: number, initialInvestment: number): number {
    const monthlyRate = annualRate / 100 / 12;
    const months = years * 12;

    const futureValueOfInitial = initialInvestment * Math.pow(1 + annualRate / 100, years);
    
    let futureValueOfSips = 0;
    if (monthlyRate > 0) {
        futureValueOfSips = monthlySip * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    } else {
        futureValueOfSips = monthlySip * months;
    }
    
    return futureValueOfInitial + futureValueOfSips;
}

export function calculateRetirementDetails(inputs: RetirementInputs): RetirementCalculations {
    const getNum = (val: number | '') => (typeof val === 'number' && !isNaN(val) && val > 0 ? val : 0);

    const currentAge = getNum(inputs.currentAge);
    const desiredRetirementAge = getNum(inputs.desiredRetirementAge);
    const lifeExpectancy = getNum(inputs.lifeExpectancy);
    const currentMonthlyExpense = getNum(inputs.currentMonthlyExpense);
    const preRetirementRoi = getNum(inputs.preRetirementRoi) / 100;
    const postRetirementRoi = getNum(inputs.postRetirementRoi) / 100;
    const incrementalRate = getNum(inputs.incrementalRate) / 100;
    
    const inflationRate = 0.06;

    if (!currentAge || !desiredRetirementAge || !lifeExpectancy || !currentMonthlyExpense || !preRetirementRoi || !postRetirementRoi) {
        return {
            expectedInflationRate: inflationRate * 100,
            realRateOfReturn: 0,
            yearsToRetirement: 0,
            yearsInRetirement: 0,
            inflatedMonthlyExpense: 0,
            annualExpenseAtRetirement: 0,
            requiredRetirementCorpus: 0,
            monthlyInvestmentNeeded: 0,
            incrementalMonthlyInvestment: 0,
        };
    }

    const realRateOfReturn = ((1 + postRetirementRoi) / (1 + inflationRate)) - 1;
    const yearsToRetirement = desiredRetirementAge - currentAge;
    const yearsInRetirement = lifeExpectancy - desiredRetirementAge;

    const inflatedMonthlyExpense = fv(inflationRate, yearsToRetirement, 0, -currentMonthlyExpense, 0);
    const annualExpenseAtRetirement = inflatedMonthlyExpense * 12;
    
    const requiredRetirementCorpus = pv(realRateOfReturn, yearsInRetirement, -annualExpenseAtRetirement, 0, 0);

    const monthlyInvestmentNeeded = pmt(preRetirementRoi / 12, yearsToRetirement * 12, 0, -requiredRetirementCorpus, 0);
    
    let incrementalMonthlyInvestment = 0;
    const preRoi = preRetirementRoi;
    const incRate = incrementalRate;
    if (preRoi !== incRate) {
        const numerator = requiredRetirementCorpus * (preRoi - incRate);
        const denominator = Math.pow(1 + preRoi, yearsToRetirement) - Math.pow(1 + incRate, yearsToRetirement);
        if (denominator !== 0) {
           incrementalMonthlyInvestment = (numerator / denominator) / 12;
        }
    }

    return {
        expectedInflationRate: inflationRate * 100,
        realRateOfReturn: realRateOfReturn * 100,
        yearsToRetirement: yearsToRetirement > 0 ? yearsToRetirement : 0,
        yearsInRetirement: yearsInRetirement > 0 ? yearsInRetirement : 0,
        inflatedMonthlyExpense,
        annualExpenseAtRetirement,
        requiredRetirementCorpus,
        monthlyInvestmentNeeded,
        incrementalMonthlyInvestment
    };
}
