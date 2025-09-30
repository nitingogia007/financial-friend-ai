'use server';
/**
 * @fileOverview A flow to fetch and process mutual fund data from MFAPI.in.
 * - fetchFunds - Fetches all mutual fund schemes and groups them by fund house.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Fund, Scheme } from '@/lib/types';

// Define the schema for the raw API response
const MfApiResponseSchema = z.array(
  z.object({
    schemeCode: z.number(),
    schemeName: z.string(),
  })
);

// Define the schema for our desired output structure
const FundSchema = z.object({
  fundName: z.string(),
  schemes: z.array(
    z.object({
      schemeCode: z.number(),
      schemeName: z.string(),
    })
  ),
});

const FetchFundsOutputSchema = z.array(FundSchema);

const fundNameExtractRegex = /^(.*?)\sMutual Fund/i;

async function processFundData(data: z.infer<typeof MfApiResponseSchema>): Promise<Fund[]> {
    const fundsMap = new Map<string, Scheme[]>();

    data.forEach(item => {
        let fundName = "Other";
        const match = item.schemeName.match(fundNameExtractRegex);
        
        if (match && match[1]) {
            fundName = `${match[1].trim()} Mutual Fund`;
        } else {
             // Fallback for names that don't fit the pattern
            const words = item.schemeName.split(' ');
            if (words.length > 1) {
                // Heuristic: take the first word if it's a common fund name, otherwise group under 'Other'
                const commonNames = ['Aditya', 'Axis', 'HDFC', 'ICICI', 'Kotak', 'Mirae', 'Nippon', 'SBI', 'UTI'];
                if (commonNames.includes(words[0])) {
                    fundName = `${words[0]} Mutual Fund`;
                }
            }
        }

        if (!fundsMap.has(fundName)) {
            fundsMap.set(fundName, []);
        }
        fundsMap.get(fundName)!.push({
            schemeCode: item.schemeCode,
            schemeName: item.schemeName,
        });
    });

    const fundsArray: Fund[] = [];
    fundsMap.forEach((schemes, fundName) => {
        fundsArray.push({ fundName, schemes });
    });

    // Sort funds by name
    return fundsArray.sort((a, b) => a.fundName.localeCompare(b.fundName));
}


const fetchFundsFlow = ai.defineFlow(
  {
    name: 'fetchFundsFlow',
    inputSchema: z.void(),
    outputSchema: FetchFundsOutputSchema,
  },
  async () => {
    const response = await fetch('https://api.mfapi.in/mf');
    if (!response.ok) {
      throw new Error(`Failed to fetch data from MFAPI: ${response.statusText}`);
    }
    const rawData: unknown = await response.json();
    
    // Validate the raw data
    const parsedData = MfApiResponseSchema.parse(rawData);

    // Process and group the data
    const processedData = await processFundData(parsedData);
    
    return processedData;
  }
);

export async function fetchFunds(): Promise<Fund[]> {
    return fetchFundsFlow();
}
