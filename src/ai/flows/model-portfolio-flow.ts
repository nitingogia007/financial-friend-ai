
'use server';

/**
 * @fileOverview Reads historical NAV data from APIs, calculates a weighted model portfolio, and compares it against the NIFTY 50 index.
 *
 * - getModelPortfolioData - Fetches and processes data for a weighted multi-fund vs Nifty 50 comparison.
 * - ModelPortfolioInput - The input type for the flow.
 * - ModelPortfolioOutput - The return type for the flow.
 */

import { z } from 'zod';
import { format, subYears, isValid } from 'date-fns';
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
    })).filter((d: any) => !isNaN(d.nav));
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
      date: format(d.date, 'dd-MM-yyyy'),
      close: d.close,
    })).filter(d => !isNaN(d.close));
  } catch (error) {
    console.error('Error fetching Nifty 50 data from Yahoo Finance:', error);
    return [];
  }
}

// Main function to get and process all data
export async function getModelPortfolioData(input: ModelPortfolioInput): Promise<ModelPortfolioOutput> {
  const { funds } = input;
  if (!funds || funds.length === 0) {
    return { chartData: [] };
  }

  const endDate = new Date();
  const startDate = subYears(endDate, 2);
  const formattedEndDate = format(endDate, 'dd-MM-yyyy');
  const formattedStartDate = format(startDate, 'dd-MM-yyyy');

  try {
    const fundNavPromises = funds.map(fund => getFundNavData(fund.schemeCode, formattedStartDate, formattedEndDate));
    const niftyPromise = getNiftyData(startDate, endDate);

    const [niftyData, ...allFundNavs] = await Promise.all([niftyPromise, ...fundNavPromises]);
    
    // Create a map for quick Nifty lookup
    const niftyMap = new Map(niftyData.map(d => [d.date, d.close]));
    
    // Create a master date list from all available data points to ensure alignment
    const allDates = new Set<string>();
    niftyData.forEach(d => allDates.add(d.date));
    allFundNavs.forEach(fundNavs => fundNavs.forEach(d => allDates.add(d.date)));
    
    const sortedDates = Array.from(allDates).sort((a, b) => {
        const dateA = new Date(a.split('-').reverse().join('-'));
        const dateB = new Date(b.split('-').reverse().join('-'));
        if (!isValid(dateA) || !isValid(dateB)) return 0;
        return dateA.getTime() - dateB.getTime();
    });

    // Create a map for each fund's NAVs for quick lookup
    const fundNavMaps = allFundNavs.map(fundNavs => new Map(fundNavs.map(d => [d.date, d.nav])));

    // Process and combine data
    const combinedData: ChartDataPoint[] = [];

    for (const date of sortedDates) {
      const dataPoint: ChartDataPoint = { date };
      const niftyValue = niftyMap.get(date);
      if (niftyValue) {
        dataPoint.nifty50 = niftyValue;
      }

      let hasFundData = false;
      funds.forEach((fund, index) => {
        const nav = fundNavMaps[index].get(date);
        if (nav) {
          dataPoint[`fund_${fund.schemeCode}`] = nav;
          hasFundData = true;
        }
      });
      
      if (dataPoint.nifty50 && hasFundData) {
        combinedData.push(dataPoint);
      }
    }
    
    // Rebase data to 100
    if (combinedData.length > 0) {
      const firstPoint = combinedData[0];
      const rebasedData = combinedData.map(d => {
        const rebasedPoint: ChartDataPoint = { date: d.date };
        
        let weightedPortfolioValue = 0;
        let totalWeightForPoint = 0;

        if (d.nifty50 && firstPoint.nifty50 && firstPoint.nifty50 > 0) {
          rebasedPoint.nifty50 = (d.nifty50 / firstPoint.nifty50) * 100;
        }

        funds.forEach(fund => {
          const key = `fund_${fund.schemeCode}`;
          const value = d[key];
          const firstValue = firstPoint[key];
          
          if (typeof value === 'number' && typeof firstValue === 'number' && firstValue > 0) {
            const rebasedValue = (value / firstValue) * 100;
            weightedPortfolioValue += rebasedValue * (fund.weight / 100);
            totalWeightForPoint += fund.weight;
          }
        });

        if (totalWeightForPoint > 0) {
            // Normalize in case some funds didn't have data for that day
            rebasedPoint.modelPortfolio = (weightedPortfolioValue / totalWeightForPoint) * 100;
        }

        return rebasedPoint;
      });

      return { chartData: rebasedData.filter(d => d.modelPortfolio !== undefined) };
    }

    return { chartData: [] };

  } catch (error) {
    console.error("Error processing model portfolio data:", error);
    return { chartData: [] };
  }
}
