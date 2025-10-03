
'use server';

/**
 * @fileOverview Reads historical NAV data from APIs, calculates a weighted model portfolio, and compares it against the NIFTY 50 index.
 *
 * - getModelPortfolioData - Fetches and processes data for a weighted multi-fund vs Nifty 50 comparison.
 * - ModelPortfolioInput - The input type for the flow.
 * - ModelPortfolioOutput - The return type for the flow.
 */

import { z } from 'zod';
import { format, subYears, isValid, parse } from 'date-fns';
import yahooFinance from 'yahoo-finance2';
import type { ModelPortfolioInput, ModelPortfolioOutput, ChartDataPoint } from '@/lib/types';


// Helper to fetch NAV data for a single fund
async function getFundNavData(schemeCode: number, startDate: string, endDate: string): Promise<{ date: string; nav: number }[]> {
  try {
    const url = `https://api.mfapi.in/mf/${schemeCode}?from=${startDate}&to=${endDate}`;
    const response = await fetch(url);
    if (!response.ok) {
        console.error(`Failed to fetch NAV for scheme ${schemeCode}: ${response.statusText}`);
        return [];
    }
    const data = await response.json();
    if (!data.data || !Array.isArray(data.data)) return [];

    return data.data.map((d: any) => ({
      date: d.date, // Format: 'DD-MM-YYYY'
      nav: parseFloat(d.nav),
    })).filter((d: any) => !isNaN(d.nav) && d.nav > 0);
  } catch (error) {
    console.error(`Error fetching or parsing NAV for scheme ${schemeCode}:`, error);
    return [];
  }
}

// Helper to fetch Nifty 50 data
async function getNiftyData(startDate: Date, endDate: Date): Promise<{ date: string; close: number }[]> {
  try {
    const results = await yahooFinance.historical('^NSEI', {
      period1: startDate,
      period2: endDate,
    });
    return results.map(d => ({
      date: format(new Date(d.date), 'dd-MM-yyyy'),
      close: d.close,
    })).filter(d => !isNaN(d.close) && d.close > 0);
  } catch (error) {
    console.error('Error fetching Nifty 50 data from Yahoo Finance:', error);
    return [];
  }
}

// Main function to get and process all data
export async function getModelPortfolioData(input: ModelPortfolioInput): Promise<ModelPortfolioOutput> {
  const { funds, includeNifty = false } = input;
  if (!funds || funds.length === 0) {
    return { chartData: [] };
  }

  const endDate = new Date();
  const startDate = subYears(endDate, 2);
  const formattedEndDate = format(endDate, 'dd-MM-yyyy');
  const formattedStartDate = format(startDate, 'dd-MM-yyyy');

  try {
    const fundNavPromises = funds.map(fund => getFundNavData(fund.schemeCode, formattedStartDate, formattedEndDate));
    
    const allFundNavs = await Promise.all(fundNavPromises);
    
    let niftyData: { date: string; close: number }[] = [];
    if (includeNifty) {
      niftyData = await getNiftyData(startDate, endDate);
    }

    const allDates = new Set<string>();
    allFundNavs.forEach(fundNavs => fundNavs.forEach(nav => allDates.add(nav.date)));
    if (includeNifty) {
      niftyData.forEach(d => allDates.add(d.date));
    }
    
    const sortedDates = Array.from(allDates).sort((aStr, bStr) => {
      const dateA = parse(aStr, 'dd-MM-yyyy', new Date());
      const dateB = parse(bStr, 'dd-MM-yyyy', new Date());
      if (!isValid(dateA) || !isValid(dateB)) return 0;
      return dateA.getTime() - dateB.getTime();
    });

    const fundNavMaps = allFundNavs.map(fundNavs => new Map(fundNavs.map(d => [d.date, d.nav])));
    const niftyMap = new Map(niftyData.map(d => [d.date, d.close]));
    
    let combinedData: ({ date: string, nifty50?: number, funds: (number|null)[] })[] = [];

    for (const date of sortedDates) {
        const fundValues = fundNavMaps.map(navMap => navMap.get(date) ?? null);

        // Only include dates where at least one fund has data
        if (fundValues.some(v => v !== null)) {
            combinedData.push({
                date,
                nifty50: niftyMap.get(date),
                funds: fundValues,
            });
        }
    }
    
    // Find the first data point where all funds have a value, to use as the baseline
    const firstValidIndex = combinedData.findIndex(d => d.funds.every(f => f !== null) && (!includeNifty || d.nifty50 !== undefined));
    if (firstValidIndex === -1) {
        console.log("No common baseline found for all funds.");
        return { chartData: [] };
    }
    
    const baseline = combinedData[firstValidIndex];
    const baselineFundValues = baseline.funds as number[];
    const baselineNifty = baseline.nifty50;
    
    const rebasedData: ChartDataPoint[] = combinedData.slice(firstValidIndex).map(d => {
      const rebasedPoint: ChartDataPoint = { date: d.date };
      
      let weightedPortfolioValue = 0;
      let totalWeightForPoint = 0;

      d.funds.forEach((value, index) => {
          if (value !== null) {
              const fund = funds[index];
              const baselineValue = baselineFundValues[index];
              if (baselineValue > 0) {
                  const rebasedValue = (value / baselineValue) * 100;
                  weightedPortfolioValue += rebasedValue * (fund.weight / 100);
                  totalWeightForPoint += fund.weight;
              }
          }
      });

      if (totalWeightForPoint > 0) {
          rebasedPoint.modelPortfolio = (weightedPortfolioValue / totalWeightForPoint) * 100;
      }
      
      if (includeNifty && d.nifty50 !== undefined && baselineNifty !== undefined && baselineNifty > 0) {
          rebasedPoint.nifty50 = (d.nifty50 / baselineNifty) * 100;
      }

      return rebasedPoint;
    }).filter(d => d.modelPortfolio !== undefined);

    return { chartData: rebasedData };

  } catch (error) {
    console.error("Error processing model portfolio data:", error);
    return { chartData: [] };
  }
}
