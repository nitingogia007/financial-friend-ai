'use server';

/**
 * @fileOverview Fetches historical NAV for a model portfolio and NIFTY 50 index.
 *
 * - getModelPortfolioData - Fetches and processes data for model portfolio vs Nifty 50 comparison.
 * - ModelPortfolioInput - The input type for the flow.
 * - ModelPortfolioOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import yahooFinance from 'yahoo-finance2';
import { subYears, format, parse } from 'date-fns';

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

async function fetchFundNav(schemeCode: number): Promise<{ date: string; nav: number }[]> {
  try {
    const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
    if (!response.ok) {
      console.error(`Failed to fetch NAV for scheme ${schemeCode}: ${response.statusText}`);
      return [];
    }
    const data = await response.json();
    if (!Array.isArray(data.data)) {
        return [];
    }
    return data.data.map((d: any) => ({
      date: d.date, // DD-MM-YYYY
      nav: parseFloat(d.nav),
    }));
  } catch (error) {
    console.error(`Error fetching NAV for scheme ${schemeCode}:`, error);
    return [];
  }
}

async function fetchNiftyData(): Promise<{ date: Date; close: number }[]> {
  const to = new Date();
  const from = subYears(to, 2);
  try {
    const results = await yahooFinance.historical('^NSEI', {
      period1: from,
      period2: to,
    });
    return results.map(r => ({ date: r.date, close: r.close }));
  } catch (error) {
    console.error('Error fetching NIFTY 50 data:', error);
    return [];
  }
}

const getModelPortfolioFlow = ai.defineFlow(
  {
    name: 'getModelPortfolioFlow',
    inputSchema: ModelPortfolioInputSchema,
    outputSchema: ModelPortfolioOutputSchema,
  },
  async ({ funds }) => {
    if (!funds || funds.length === 0) {
      return { chartData: [] };
    }
    
    console.log('Fetching data for funds:', funds);

    const [niftyData, ...fundNavs] = await Promise.all([
      fetchNiftyData(),
      ...funds.map(fund => fetchFundNav(fund.schemeCode)),
    ]);

    const formattedNiftyData: Record<string, number> = niftyData.reduce((acc, curr) => {
        const formattedDate = format(curr.date, 'dd-MM-yyyy');
        acc[formattedDate] = curr.close;
        return acc;
    }, {} as Record<string, number>);

    const fundNavsByDate: Record<string, number[]> = {};
    const dates = new Set<string>();

    fundNavs.forEach((navData, fundIndex) => {
      navData.forEach(navPoint => {
        if (!fundNavsByDate[navPoint.date]) {
          fundNavsByDate[navPoint.date] = Array(funds.length).fill(NaN);
        }
        fundNavsByDate[navPoint.date][fundIndex] = navPoint.nav;
        dates.add(navPoint.date);
      });
    });

    const sortedDates = Array.from(dates).sort((a, b) => {
        try {
            return parse(a, 'dd-MM-yyyy', new Date()).getTime() - parse(b, 'dd-MM-yyyy', new Date()).getTime();
        } catch {
            return 0;
        }
    });

    // Fill missing values by carrying forward the last known value
    for (let fundIndex = 0; fundIndex < funds.length; fundIndex++) {
        let lastNav = NaN;
        for (const date of sortedDates) {
            if (fundNavsByDate[date]) {
                 if (isNaN(fundNavsByDate[date][fundIndex])) {
                    fundNavsByDate[date][fundIndex] = lastNav;
                } else {
                    lastNav = fundNavsByDate[date][fundIndex];
                }
            }
        }
    }
    
    const combinedData: ChartDataPoint[] = [];
    sortedDates.forEach(date => {
        const navs = fundNavsByDate[date];
        const niftyValue = formattedNiftyData[date];

        if (navs && navs.every(nav => !isNaN(nav))) {
            const modelPortfolioNav = navs.reduce((acc, nav, index) => {
                const weight = funds[index].weight / 100;
                return acc + (nav * weight);
            }, 0);
            
            combinedData.push({
                date,
                modelPortfolio: modelPortfolioNav,
                nifty50: niftyValue
            });
        }
    });

    // Rebase data to 100
    if (combinedData.length > 0) {
      const firstModelPoint = combinedData.find(d => d.modelPortfolio !== undefined)?.modelPortfolio;
      const firstNiftyPoint = combinedData.find(d => d.nifty50 !== undefined)?.nifty50;

      if (firstModelPoint && firstNiftyPoint) {
        return {
            chartData: combinedData.map(d => ({
                date: d.date,
                modelPortfolio: d.modelPortfolio ? (d.modelPortfolio / firstModelPoint) * 100 : undefined,
                nifty50: d.nifty50 ? (d.nifty50 / firstNiftyPoint) * 100 : undefined,
            })).filter(d => d.modelPortfolio !== undefined && d.nifty50 !== undefined)
        };
      }
    }

    return { chartData: [] };
  }
);


export async function getModelPortfolioData(input: ModelPortfolioInput): Promise<ModelPortfolioOutput> {
    return getModelPortfolioFlow(input);
}
