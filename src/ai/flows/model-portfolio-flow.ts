
'use server';

/**
 * @fileOverview Reads historical NAV data from APIs, calculates a weighted model portfolio, and compares it against a benchmark index.
 *
 * - getModelPortfolioData - Fetches and processes data for a weighted multi-fund vs benchmark comparison.
 * - ModelPortfolioInput - The input type for the flow.
 * - ModelPortfolioOutput - The return type for the flow.
 */

import { z } from 'zod';
import { format, subYears, isValid, parse } from 'date-fns';
import yahooFinance from 'yahoo-finance2';
import type { ModelPortfolioInput, ModelPortfolioOutput, ChartDataPoint } from '@/lib/types';
import Papa from 'papaparse';
import path from 'path';
import fs from 'fs';


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

// Helper to fetch Nifty 50 data from Yahoo Finance
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

// Helper to fetch benchmark data from a local CSV file
async function getBenchmarkDataFromCsv(fileName: string): Promise<{ date: string; close: number }[]> {
    try {
        const csvPath = path.join(process.cwd(), 'public', 'csv', fileName);
        const csvFile = fs.readFileSync(csvPath, 'utf-8');
        
        return new Promise((resolve, reject) => {
            Papa.parse(csvFile, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length) {
                        console.error("Errors parsing CSV:", results.errors);
                        reject(new Error('Failed to parse benchmark CSV file.'));
                        return;
                    }
                    
                    const formattedData = results.data.map((row: any) => {
                        // The key is to parse the date from the CSV and re-format it to DD-MM-YYYY
                        const parsedDate = parse(row.Date, 'dd-MMM-yyyy', new Date());
                        if (isValid(parsedDate)) {
                            return {
                                date: format(parsedDate, 'dd-MM-yyyy'),
                                close: row.Close
                            }
                        }
                        return null;
                    }).filter(d => d && typeof d.close === 'number' && !isNaN(d.close) && d.close > 0) as { date: string; close: number }[];

                    resolve(formattedData);
                },
                error: (error: Error) => {
                    console.error("PapaParse error:", error);
                    reject(error);
                }
            });
        });
    } catch (error) {
        console.error(`Error reading or parsing ${fileName}:`, error);
        return [];
    }
}


// Main function to get and process all data
export async function getModelPortfolioData(input: ModelPortfolioInput): Promise<ModelPortfolioOutput> {
  const { funds, benchmark } = input;
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
    
    let benchmarkData: { date: string; close: number }[] = [];
    if (benchmark === 'nifty50') {
      benchmarkData = await getNiftyData(startDate, endDate);
    } else if (benchmark === 'debt') {
      benchmarkData = await getBenchmarkDataFromCsv('NIFTY_10_YR_BENCHMARK_G-SEC.csv');
    }


    const allDates = new Set<string>();
    allFundNavs.forEach(fundNavs => fundNavs.forEach(nav => allDates.add(nav.date)));
    if (benchmark) {
      benchmarkData.forEach(d => allDates.add(d.date));
    }
    
    const sortedDates = Array.from(allDates).sort((aStr, bStr) => {
      const dateA = parse(aStr, 'dd-MM-yyyy', new Date());
      const dateB = parse(bStr, 'dd-MM-yyyy', new Date());
      if (!isValid(dateA) || !isValid(dateB)) return 0;
      return dateA.getTime() - dateB.getTime();
    });

    const fundNavMaps = allFundNavs.map(fundNavs => new Map(fundNavs.map(d => [d.date, d.nav])));
    const benchmarkMap = new Map(benchmarkData.map(d => [d.date, d.close]));
    
    let combinedData: ({ date: string, benchmark?: number, funds: (number|null)[] })[] = [];

    for (const date of sortedDates) {
        const fundValues = fundNavMaps.map(navMap => navMap.get(date) ?? null);

        // Only include dates where at least one fund has data
        if (fundValues.some(v => v !== null)) {
            combinedData.push({
                date,
                benchmark: benchmarkMap.get(date),
                funds: fundValues,
            });
        }
    }
    
    // Find the first data point where all funds have a value, to use as the baseline
    const firstValidIndex = combinedData.findIndex(d => d.funds.every(f => f !== null) && (!benchmark || d.benchmark !== undefined));
    if (firstValidIndex === -1) {
        console.log("No common baseline found for all funds.");
        return { chartData: [] };
    }
    
    const baseline = combinedData[firstValidIndex];
    const baselineFundValues = baseline.funds as number[];
    const baselineBenchmark = baseline.benchmark;
    
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
      
      if (benchmark && d.benchmark !== undefined && baselineBenchmark !== undefined && baselineBenchmark > 0) {
          rebasedPoint.benchmark = (d.benchmark / baselineBenchmark) * 100;
      }

      return rebasedPoint;
    }).filter(d => d.modelPortfolio !== undefined);

    return { chartData: rebasedData };

  } catch (error) {
    console.error("Error processing model portfolio data:", error);
    return { chartData: [] };
  }
}
