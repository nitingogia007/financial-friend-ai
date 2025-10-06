'use server';

/**
 * @fileOverview Analyzes a mutual fund factsheet from a PDF URL.
 * - analyzeFactsheet - A function that takes a PDF URL and returns structured data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { media } from 'genkit/tools';

// Define the schema for the output data we want from the AI model
const FactsheetDataSchema = z.object({
  fundName: z.string().describe('The name of the mutual fund.'),
  netAssets: z.string().describe('The total net assets of the fund (e.g., "₹10,234.56 Cr").'),
  industryAllocation: z
    .array(
      z.object({
        sector: z.string().describe('The name of the industry sector.'),
        weight: z.number().describe('The percentage weight of the sector in the portfolio.'),
      })
    )
    .describe('The breakdown of equity holdings by industry sector.'),
  portfolioHoldings: z
    .array(
      z.object({
        stock: z.string().describe('The name of the stock holding.'),
        weight: z.number().describe('The percentage weight of the stock in the portfolio.'),
      })
    )
    .describe('The top portfolio holdings.'),
});

export type FactsheetData = z.infer<typeof FactsheetDataSchema>;

// Define the Genkit prompt
const analyzeFactsheetPrompt = ai.definePrompt({
  name: 'analyzeFactsheetPrompt',
  input: { schema: z.object({ pdfUrl: z.string() }) },
  output: { schema: FactsheetDataSchema },
  prompt: `You are a financial data extraction expert. Analyze the provided mutual fund factsheet PDF. Extract the following information accurately:
1.  **Fund Name**: The full name of the fund.
2.  **Net Assets**: The total net asset value, formatted as a string (e.g., "₹5,432.10 Cr").
3.  **Industry Allocation of Equity Holdings**: A list of all industry sectors and their corresponding percentage weight.
4.  **Portfolio Holdings**: A list of the top stock holdings and their corresponding percentage weight.

Return the data in the specified JSON format.

Factsheet PDF: {{media url=pdfUrl}}`,
});

// Define the Genkit flow
const analyzeFactsheetFlow = ai.defineFlow(
  {
    name: 'analyzeFactsheetFlow',
    inputSchema: z.string(), // Expects a PDF URL
    outputSchema: FactsheetDataSchema,
  },
  async (pdfUrl) => {
    // Validate the URL format (basic check)
    if (!pdfUrl.startsWith('http')) {
      throw new Error('Invalid PDF URL provided. Must be a public URL.');
    }

    try {
      const { output } = await analyzeFactsheetPrompt({ pdfUrl });

      if (!output) {
        throw new Error('Failed to analyze the factsheet. The model did not return any data.');
      }
      
      return output;
    } catch (error: any) {
        console.error("Error in analyzeFactsheetFlow: ", error);
        if (error.message && error.message.includes('over limit')) {
            throw new Error('The PDF file is too large for analysis. Please provide a file under 10MB.');
        }
        throw new Error(`Failed to process PDF from URL: ${error.message}`);
    }
  }
);

/**
 * Wrapper function to be called from the client.
 * @param pdfUrl The public URL of the PDF factsheet.
 * @returns A promise that resolves to the extracted FactsheetData.
 */
export async function analyzeFactsheet(pdfUrl: string): Promise<FactsheetData> {
  return analyzeFactsheetFlow(pdfUrl);
}
