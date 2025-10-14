
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
                    
                    const dateFormatsToTry = ['yyyy-MM-dd', 'dd-MMM-yy', 'MM/dd/yyyy', 'dd-MM-yyyy'];

                    const formattedData = results.data.map((row: any) => {
                        const dateStr = (row.Date || row.date);
                        const closeStr = (row.Close || row.close || row['Nifty 500'] || row['Nifty 50 50']);

                        if (!dateStr || !closeStr) return null;

                        let parsedDate: Date | null = null;
                        for (const fmt of dateFormatsToTry) {
                            const d = parse(dateStr, fmt, new Date());
                            if (isValid(d)) {
                                parsedDate = d;
                                break;
                            }
                        }
                        
                        const closeValue = typeof closeStr === 'string' ? parseFloat(closeStr.replace(/,/g, '')) : closeStr;

                        if (parsedDate && typeof closeValue === 'number' && !isNaN(closeValue) && closeValue > 0) {
                            return {
                                date: format(parsedDate, 'dd-MM-yyyy'),
                                close: closeValue
                            }
                        }
                        return null;
                    }).filter(d => d) as { date: string; close: number }[];
                    
                    resolve(formattedData.sort((a, b) => parse(b.date, 'dd-MM-yyyy', new Date()).getTime() - parse(a.date, 'dd-MM-yyyy', new Date()).getTime()));
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
    let benchmarkData: { date: string; close: number }[] = [];
    if (benchmark === 'nifty50') {
      benchmarkData = await getBenchmarkDataFromCsv('NIFTY_50_Index.csv');
    } else if (benchmark === 'debt') {
      benchmarkData = await getBenchmarkDataFromCsv('NIFTY_10_YR_BENCHMARK_G-SEC.csv');
    } else if (benchmark === 'hybrid') {
        benchmarkData = await getBenchmarkDataFromCsv('NIFTY_50_HYBRID_COMPOSITE_DEBT_50-50_Index.csv');
    }

    if (!benchmark || benchmarkData.length === 0) {
      console.error("Benchmark data could not be fetched or is empty.");
      return { chartData: [] };
    }

    const fundNavPromises = funds.map(fund => getFundNavData(fund.schemeCode, formattedStartDate, formattedEndDate));
    const allFundNavs = await Promise.all(fundNavPromises);

    if (allFundNavs.some(navs => navs.length === 0)) {
        console.warn("One or more funds returned no NAV data.");
    }
    
    // Use benchmark dates as the master list of dates, reversed to go from past to present
    const masterDates = benchmarkData.map(d => d.date).reverse();

    const fundNavMaps = allFundNavs.map(fundNavs => new Map(fundNavs.map(d => [d.date, d.nav])));
    const benchmarkMap = new Map(benchmarkData.map(d => [d.date, d.close]));
    
    let chartData: ChartDataPoint[] = [];
    let initialPortfolioValue: number | null = null;
    let initialBenchmarkValue: number | null = null;

    const lastKnownNavs: (number | null)[] = Array(funds.length).fill(null);

    for (const date of masterDates) {
        let portfolioValueForDate = 0;
        let totalWeightForDate = 0;
        let allFundsHaveNav = true;

        for (let i = 0; i < funds.length; i++) {
            const fund = funds[i];
            const navMap = fundNavMaps[i];
            
            if (navMap.has(date)) {
                lastKnownNavs[i] = navMap.get(date)!;
            }
            
            if (lastKnownNavs[i] !== null) {
                portfolioValueForDate += lastKnownNavs[i]! * (fund.weight / 100);
                totalWeightForDate += fund.weight;
            } else {
                allFundsHaveNav = false;
            }
        }
        
        // Wait until we have the first NAV for all funds before starting calculations
        if (!allFundsHaveNav) {
            continue;
        }

        const benchmarkValue = benchmarkMap.get(date);

        if (benchmarkValue !== undefined) {
            if (initialPortfolioValue === null) {
                initialPortfolioValue = portfolioValueForDate;
            }
            if (initialBenchmarkValue === null && benchmarkValue) {
                initialBenchmarkValue = benchmarkValue;
            }

            if (initialPortfolioValue > 0 && initialBenchmarkValue! > 0 && portfolioValueForDate > 0) {
                const rebasedPoint: ChartDataPoint = { date };
                rebasedPoint.modelPortfolio = (portfolioValueForDate / initialPortfolioValue) * 100;
                rebasedPoint.benchmark = (benchmarkValue / initialBenchmarkValue) * 100;
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
