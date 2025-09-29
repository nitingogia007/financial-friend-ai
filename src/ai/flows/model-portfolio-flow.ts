
'use server';

/**
 * @fileOverview Reads historical NAV data from APIs and compares a model portfolio against the NIFTY 50 index.
 *
 * - getModelPortfolioData - Fetches and processes data for model portfolio vs Nifty 50 comparison.
 * - ModelPortfolioInput - The input type for the flow.
 * - ModelPortfolioOutput - The return type for the flow.
 */

import { z } from 'zod';
import { format, subYears, isValid } from 'date-fns';
import yahooFinance from 'yahoo-finance2';

const ModelPortfolioInputSchema = z.object({
  funds: z.array(z.object({
    schemeCode: z.number(),
    weight: z.number(),
  })).describe('An array of funds with their scheme codes and weights (0-100).'),
});
export type ModelPortfolioInput = z.infer<typeof ModelPortfolioInputSchema>;

const ChartDataPointSchema = z.object({
  date: z.string(),
  modelPortfolio: z.number().optional(),
  nifty50: z.number().optional(),
});
export type ChartDataPoint = z.infer<typeof ChartDataPointSchema>;

const ModelPortfolioOutputSchema = z.object({
  chartData: z.array(ChartDataPointSchema),
});
export type ModelPortfolioOutput = z.infer<typeof ModelPortfolioOutputSchema>;

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
        const niftyValue = niftyMap.get(date);

        let modelPortfolioNav = 0;
        let totalWeightForDate = 0;

        funds.forEach((fund, index) => {
            const nav = fundNavMaps[index].get(date);
            if (nav) {
                modelPortfolioNav += nav * (fund.weight / 100);
                totalWeightForDate += (fund.weight);
            }
        });

        // Only include data point if we have data for both portfolio and nifty
        if (niftyValue && totalWeightForDate > 0) {
             // Normalize the model portfolio NAV if some funds didn't have data for that date
             const totalWeightPercentage = totalWeightForDate / 100;
             const adjustedModelNav = totalWeightPercentage > 0 ? modelPortfolioNav / totalWeightPercentage : 0;
             
            if (adjustedModelNav > 0) {
                combinedData.push({
                    date,
                    modelPortfolio: adjustedModelNav,
                    nifty50: niftyValue,
                });
            }
        }
    }
    
    // Rebase data to 100
    if (combinedData.length > 0) {
        const firstModelPoint = combinedData[0].modelPortfolio;
        const firstNiftyPoint = combinedData[0].nifty50;

        if (firstModelPoint && firstNiftyPoint && firstModelPoint > 0 && firstNiftyPoint > 0) {
            const rebasedData = combinedData.map(d => ({
                date: d.date,
                modelPortfolio: d.modelPortfolio ? (d.modelPortfolio / firstModelPoint) * 100 : undefined,
                nifty50: d.nifty50 ? (d.nifty50 / firstNiftyPoint) * 100 : undefined,
            }));
            return { chartData: rebasedData };
        }
    }

    return { chartData: [] };

  } catch (error) {
    console.error("Error processing model portfolio data:", error);
    return { chartData: [] };
  }
}
