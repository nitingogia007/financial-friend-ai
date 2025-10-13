
'use server';

/**
 * @fileOverview Reads historical NAV data from APIs, calculates a weighted model portfolio, and compares it against a benchmark index.
 *
 * - getModelPortfolioData - Fetches and processes data for a weighted multi-fund vs benchmark comparison.
 * - ModelPortfolioInput - The input type for the flow.
 * - ModelPortfolioOutput - The return type for the flow.
 */

import { z } from 'zod';
import { format, subYears, isValid, parse, isAfter, isEqual } from 'date-fns';
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
                        const dateStr = (row.Date || row.date);
                        if (!dateStr) return null;

                        // Try multiple date formats
                        const parsedDate = parse(dateStr, 'dd-MMM-yy', new Date());
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
    
    const sortedDates = Array.from(allDates)
      .map(dStr => parse(dStr, 'dd-MM-yyyy', new Date()))
      .filter(isValid)
      .sort((a, b) => a.getTime() - b.getTime())
      .map(d => format(d, 'dd-MM-yyyy'));

    const fundNavMaps = allFundNavs.map(fundNavs => new Map(fundNavs.map(d => [d.date, d.nav])));
    const benchmarkMap = new Map(benchmarkData.map(d => [d.date, d.close]));
    
    // --- New Resilient Data Processing Logic ---

    // 1. Create a full data map with all available data points
    const fullDataMap = new Map<string, { funds: (number | null)[]; benchmark?: number }>();
    sortedDates.forEach(date => {
        fullDataMap.set(date, {
            funds: fundNavMaps.map(navMap => navMap.get(date) ?? null),
            benchmark: benchmarkMap.get(date)
        });
    });

    // 2. Find the earliest valid start date for each fund and benchmark
    const fundStartDates = fundNavMaps.map(navMap => {
        const firstDate = sortedDates.find(d => navMap.has(d));
        return firstDate ? parse(firstDate, 'dd-MM-yyyy', new Date()) : null;
    }).filter(d => d !== null) as Date[];

    if (benchmark) {
        const firstBenchmarkDate = sortedDates.find(d => benchmarkMap.has(d));
        if (firstBenchmarkDate) {
            fundStartDates.push(parse(firstBenchmarkDate, 'dd-MM-yyyy', new Date()));
        }
    }
    
    if (fundStartDates.length === 0) return { chartData: [] };

    // 3. Determine the common baseline date (the latest of all start dates)
    const baselineDate = fundStartDates.reduce((latest, current) => isAfter(current, latest) ? current : latest);

    // 4. Find the initial baseline values on or just before the baselineDate
    const getBaselineValue = (dataMap: Map<string, number>, date: Date) => {
        let currentDate = date;
        while(currentDate.getTime() >= startDate.getTime()) {
            const dateStr = format(currentDate, 'dd-MM-yyyy');
            if (dataMap.has(dateStr)) {
                return dataMap.get(dateStr);
            }
            currentDate.setDate(currentDate.getDate() - 1);
        }
        return null;
    }
    
    const baselineFundValues = fundNavMaps.map(navMap => getBaselineValue(navMap, baselineDate));
    const baselineBenchmark = benchmark ? getBaselineValue(benchmarkMap, baselineDate) : null;

    if (baselineFundValues.some(v => v === null) || (benchmark && baselineBenchmark === null)) {
         console.error("Could not establish a common baseline for all assets.");
         return { chartData: [] };
    }

    // 5. Build the final chart data with forward-filling for missing values
    const chartData: ChartDataPoint[] = [];
    const validDates = sortedDates
      .map(d => parse(d, 'dd-MM-yyyy', new Date()))
      .filter(d => isAfter(d, baselineDate) || isEqual(d, baselineDate));
      
    let lastFundValues = [...baselineFundValues];
    let lastBenchmarkValue = baselineBenchmark;

    for (const date of validDates) {
      const dateStr = format(date, 'dd-MM-yyyy');
      const dayData = fullDataMap.get(dateStr);

      if (!dayData) continue;
      
      const currentFundValues = dayData.funds.map((v, i) => v ?? lastFundValues[i]);
      const currentBenchmarkValue = dayData.benchmark ?? lastBenchmarkValue;

      let weightedPortfolioValue = 0;
      let totalWeightForPoint = 0;

      currentFundValues.forEach((value, index) => {
          if (value !== null) {
              const fund = funds[index];
              const baselineValue = baselineFundValues[index];
              if (baselineValue && baselineValue > 0) {
                  const rebasedValue = (value / baselineValue) * 100;
                  weightedPortfolioValue += rebasedValue * (fund.weight / 100);
                  totalWeightForPoint += fund.weight;
              }
          }
      });
      
      const rebasedPoint: ChartDataPoint = { date: dateStr };
      if (totalWeightForPoint > 0) {
          // Normalize the weighted value
          rebasedPoint.modelPortfolio = (weightedPortfolioValue / (totalWeightForPoint / 100));
      }

       if (benchmark && currentBenchmarkValue !== undefined && currentBenchmarkValue !== null && baselineBenchmark && baselineBenchmark > 0) {
          rebasedPoint.benchmark = (currentBenchmarkValue / baselineBenchmark) * 100;
      }
      
      if (rebasedPoint.modelPortfolio !== undefined) {
         chartData.push(rebasedPoint);
      }
      
      lastFundValues = currentFundValues;
      lastBenchmarkValue = currentBenchmarkValue;
    }

    return { chartData };

  } catch (error) {
    console.error("Error processing model portfolio data:", error);
    return { chartData: [] };
  }
}
