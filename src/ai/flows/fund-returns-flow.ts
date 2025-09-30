
'use server';
/**
 * @fileOverview A flow to calculate mutual fund returns (CAGR) for 3, 5, and 10 years.
 * - getFundReturns - Calculates annualized returns for a given scheme code.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { subYears, format, parse } from 'date-fns';
import type { FundReturnsInput, FundReturnsOutput } from '@/lib/types';

const FundReturnsInputSchema = z.object({
  schemeCode: z.number(),
});

const FundReturnsOutputSchema = z.object({
  threeYearReturn: z.string().nullable(),
  fiveYearReturn: z.string().nullable(),
  tenYearReturn: z.string().nullable(),
});

// Helper to calculate CAGR
function calculateCagr(startValue: number, endValue: number, years: number): string | null {
  if (startValue <= 0 || endValue <= 0 || years <= 0) {
    return null;
  }
  const cagr = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
  return `${cagr.toFixed(2)}%`;
}

// Helper to find the closest NAV data point to a target date
function findClosestNav(data: { date: string; nav: string }[], targetDate: Date): { date: string; nav: string } | null {
  if (!data || data.length === 0) return null;

  let closest = null;
  let minDiff = Infinity;

  for (const point of data) {
    const pointDate = parse(point.date, 'dd-MM-yyyy', new Date());
    const diff = Math.abs(pointDate.getTime() - targetDate.getTime());
    if (diff < minDiff) {
      minDiff = diff;
      closest = point;
    }
  }
  return closest;
}

const fundReturnsFlow = ai.defineFlow(
  {
    name: 'fundReturnsFlow',
    inputSchema: FundReturnsInputSchema,
    outputSchema: FundReturnsOutputSchema,
  },
  async ({ schemeCode }) => {
    const today = new Date();
    const tenYearsAgo = subYears(today, 10);
    const fiveYearsAgo = subYears(today, 5);
    const threeYearsAgo = subYears(today, 3);
    
    const startDate = format(tenYearsAgo, 'dd-MM-yyyy');
    const endDate = format(today, 'dd-MM-yyyy');

    try {
      const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}?from=${startDate}&to=${endDate}`);
      if (!response.ok) {
        console.error(`Failed to fetch NAV for scheme ${schemeCode}: ${response.statusText}`);
        return { threeYearReturn: null, fiveYearReturn: null, tenYearReturn: null };
      }
      const result = await response.json();
      const navData: { date: string; nav: string }[] = result.data;

      if (!navData || navData.length < 2) {
        return { threeYearReturn: null, fiveYearReturn: null, tenYearReturn: null };
      }
      
      const latestNavData = navData[0];
      const endValue = parseFloat(latestNavData.nav);

      const tenYearData = findClosestNav(navData, tenYearsAgo);
      const fiveYearData = findClosestNav(navData, fiveYearsAgo);
      const threeYearData = findClosestNav(navData, threeYearsAgo);

      const tenYearStartValue = tenYearData ? parseFloat(tenYearData.nav) : null;
      const fiveYearStartValue = fiveYearData ? parseFloat(fiveYearData.nav) : null;
      const threeYearStartValue = threeYearData ? parseFloat(threeYearData.nav) : null;

      return {
        tenYearReturn: tenYearStartValue ? calculateCagr(tenYearStartValue, endValue, 10) : null,
        fiveYearReturn: fiveYearStartValue ? calculateCagr(fiveYearStartValue, endValue, 5) : null,
        threeYearReturn: threeYearStartValue ? calculateCagr(threeYearStartValue, endValue, 3) : null,
      };

    } catch (error) {
      console.error(`Error calculating returns for scheme ${schemeCode}:`, error);
      return { threeYearReturn: null, fiveYearReturn: null, tenYearReturn: null };
    }
  }
);


export async function getFundReturns(input: FundReturnsInput): Promise<FundReturnsOutput> {
  return fundReturnsFlow(input);
}
