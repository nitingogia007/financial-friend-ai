
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
                    
                    const dateFormatsToTry = ['dd-MMM-yy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'dd-MM-yyyy'];

                    const formattedData = results.data.map((row: any) => {
                        const dateStr = (row.Date || row.date);
                        if (!dateStr) return null;

                        let parsedDate: Date | null = null;
                        for (const fmt of dateFormatsToTry) {
                            const d = parse(dateStr, fmt, new Date());
                            if (isValid(d)) {
                                parsedDate = d;
                                break;
                            }
                        }
                        
                        if (parsedDate) {
                            return {
                                date: format(parsedDate, 'dd-MM-yyyy'),
                                close: row.Close || row.close
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

    if (allFundNavs.some(navs => navs.length === 0)) {
        console.warn("One or more funds returned no NAV data.");
        // We can proceed, but the portfolio will be weighted based on funds that did return data.
    }
    if (benchmark && benchmarkData.length === 0) {
        console.error("Benchmark data could not be fetched.");
        // Depending on requirements, we could return just portfolio data or fail.
        // For now, let's try to proceed without benchmark.
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
    
    let chartData: ChartDataPoint[] = [];
    let initialPortfolioValue: number | null = null;
    let initialBenchmarkValue: number | null = null;

    for (const date of sortedDates) {
        let portfolioValueForDate = 0;
        let totalWeightForDate = 0;
        let canCalculatePortfolio = true;

        for (let i = 0; i < funds.length; i++) {
            const fund = funds[i];
            const navMap = fundNavMaps[i];
            if (navMap.has(date)) {
                portfolioValueForDate += navMap.get(date)! * (fund.weight / 100);
                totalWeightForDate += fund.weight;
            } else {
                // If a fund is missing data on a particular day, we might decide to skip this day for the portfolio
                // For simplicity now, we assume all funds have data on the dates present in sortedDates from their respective ranges
            }
        }
        
        // Normalize portfolio value to total weight for the day, if not all funds were present
        if (totalWeightForDate > 0 && totalWeightForDate < 100) {
            portfolioValueForDate = portfolioValueForDate / (totalWeightForDate / 100);
        } else if (totalWeightForDate === 0) {
            canCalculatePortfolio = false;
        }


        const benchmarkValue = benchmarkMap.get(date);

        if (canCalculatePortfolio && (benchmark ? benchmarkValue !== undefined : true)) {
            if (initialPortfolioValue === null) {
                initialPortfolioValue = portfolioValueForDate;
            }
             if (benchmark && initialBenchmarkValue === null && benchmarkValue) {
                initialBenchmarkValue = benchmarkValue;
            }

            const rebasedPoint: ChartDataPoint = { date };

            if (initialPortfolioValue !== null && initialPortfolioValue > 0) {
                rebasedPoint.modelPortfolio = (portfolioValueForDate / initialPortfolioValue) * 100;
            }
            if (benchmark && initialBenchmarkValue !== null && initialBenchmarkValue > 0 && benchmarkValue) {
                rebasedPoint.benchmark = (benchmarkValue / initialBenchmarkValue) * 100;
            }

            if (rebasedPoint.modelPortfolio !== undefined) {
               chartData.push(rebasedPoint);
            }
        }
    }

    return { chartData };

  } catch (error) {
    console.error("Error processing model portfolio data:", error);
    return { chartData: [] };
  }
}
