
'use server';

/**
 * @fileOverview Reads historical NAV data from a local CSV and compares a model portfolio against the NIFTY 50 index.
 *
 * - getModelPortfolioData - Fetches and processes data for model portfolio vs Nifty 50 comparison from a CSV file.
 * - ModelPortfolioInput - The input type for the flow.
 * - ModelPortfolioOutput - The return type for the flow.
 */

import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import Papa from 'papaparse';
import { parse, format } from 'date-fns';

const ModelPortfolioInputSchema = z.object({
  funds: z.array(z.object({
    schemeName: z.string(),
    weight: z.number(),
  })).describe('An array of funds with their scheme names and weights (0-100).'),
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

// Helper function to read and parse the CSV file
function getCsvData(): Promise<any[]> {
    // Construct the path to the CSV file relative to the project root
    const filePath = path.join(process.cwd(), 'src', 'lib', 'Sheet3.csv');

    return new Promise((resolve, reject) => {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        Papa.parse(fileContent, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    console.error("CSV parsing errors:", results.errors);
                    reject(new Error('Failed to parse CSV file.'));
                } else {
                    resolve(results.data);
                }
            },
            error: (error: Error) => {
                console.error("CSV parsing error:", error);
                reject(error);
            }
        });
    });
}


export async function getModelPortfolioData(input: ModelPortfolioInput): Promise<ModelPortfolioOutput> {
    const { funds } = input;
    if (!funds || funds.length === 0) {
      return { chartData: [] };
    }

    try {
        const csvData = await getCsvData();
        if (!csvData || csvData.length === 0) {
             console.error("CSV data is empty or could not be read.");
             return { chartData: [] };
        }
        
        const combinedData = csvData.map(row => {
            const dateStr = row.Date;
            if (!dateStr) return null;

            // Attempt to parse the date from various possible formats
            let date: Date;
            try {
                 // Handles DD-MM-YYYY, DD/MM/YYYY
                 if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(dateStr)) {
                    date = parse(dateStr, 'dd-MM-yyyy', new Date());
                } 
                // Handles YYYY-MM-DD
                else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                    date = parse(dateStr, 'yyyy-MM-dd', new Date());
                } 
                // Handles MM/DD/YYYY from Excel's default
                else if (/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(dateStr)) {
                     date = new Date(dateStr);
                }
                else {
                    throw new Error("Unrecognized date format");
                }
                if (isNaN(date.getTime())) throw new Error("Invalid date parsed");

            } catch (e) {
                console.warn(`Skipping invalid date format: ${dateStr}`);
                return null;
            }

            const niftyValue = row['NIFTY 50'];

            const modelPortfolioNav = funds.reduce((acc, fund) => {
                const fundNav = row[fund.schemeName];
                if (typeof fundNav === 'number' && !isNaN(fundNav)) {
                    const weight = fund.weight / 100;
                    return acc + (fundNav * weight);
                }
                return acc;
            }, 0);

            // Only include the data point if we have a valid model NAV and Nifty value
            if (modelPortfolioNav > 0 && typeof niftyValue === 'number' && !isNaN(niftyValue)) {
                 return {
                    date: format(date, 'dd-MM-yyyy'),
                    modelPortfolio: modelPortfolioNav,
                    nifty50: niftyValue,
                };
            }
            return null;

        }).filter((d): d is ChartDataPoint => d !== null);


        // Sort by date just in case
        combinedData.sort((a, b) => parse(a.date, 'dd-MM-yyyy', new Date()).getTime() - parse(b.date, 'dd-MM-yyyy', new Date()).getTime());

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
        console.error("Error processing portfolio data from CSV:", error);
        return { chartData: [] };
    }
}
