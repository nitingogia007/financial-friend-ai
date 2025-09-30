'use server';
/**
 * @fileOverview A flow to fetch and process mutual fund data from MFAPI.in.
 * - fetchFunds - Fetches all mutual fund schemes and groups them by fund house.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
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

const fundHouses = [
    "360 ONE Mutual Fund",
    "Aditya Birla Sun Life Mutual Fund",
    "Axis Mutual Fund",
    "Bajaj Finserv Mutual Fund",
    "Bandhan Mutual Fund",
    "Bank of India Mutual Fund",
    "Baroda BNP Paribas Mutual Fund",
    "Canara Robeco Mutual Fund",
    "DSP Mutual Fund",
    "Edelweiss Mutual Fund",
    "Franklin Templeton Mutual Fund",
    "HDFC Mutual Fund",
    "HSBC Mutual Fund",
    "ICICI Prudential Mutual Fund",
    "IDBI Mutual Fund",
    "Invesco Mutual Fund",
    "ITI Mutual Fund",
    "JM Financial Mutual Fund",
    "Kotak Mahindra Mutual Fund",
    "LIC Mutual Fund",
    "Mahindra Manulife Mutual Fund",
    "Mirae Asset Mutual Fund",
    "Motilal Oswal Mutual Fund",
    "Navi Mutual Fund",
    "Nippon India Mutual Fund",
    "NJ Mutual Fund",
    "Old Bridge Mutual Fund",
    "PGIM India Mutual Fund",
    "PPFAS Mutual Fund",
    "Quant Mutual Fund",
    "Quantum Mutual Fund",
    "SBI Mutual Fund",
    "Samco Mutual Fund",
    "Shriram Mutual Fund",
    "Sundaram Mutual Fund",
    "Tata Mutual Fund",
    "Taurus Mutual Fund",
    "Trust Mutual Fund",
    "Union Mutual Fund",
    "UTI Mutual Fund",
    "WhiteOak Capital Mutual Fund",
    "Zerodha Mutual Fund",
    "Groww Mutual Fund",
    "Helios Mutual Fund",
    "Unifi Mutual Fund",
    "Angel One Mutual Fund"
].sort();


async function processFundData(data: z.infer<typeof MfApiResponseSchema>): Promise<Fund[]> {
    const fundsMap = new Map<string, Scheme[]>();
    
    // Initialize map with all known fund houses to maintain order and inclusion
    fundHouses.forEach(house => fundsMap.set(house, []));

    data.forEach(item => {
        let foundHouse = false;
        for (const house of fundHouses) {
            // Check if scheme name starts with the fund house name (without "Mutual Fund")
            const houseNamePattern = house.replace(" Mutual Fund", "").toLowerCase();
            if (item.schemeName.toLowerCase().startsWith(houseNamePattern)) {
                fundsMap.get(house)!.push({
                    schemeCode: item.schemeCode,
                    schemeName: item.schemeName,
                });
                foundHouse = true;
                break;
            }
        }

        if (!foundHouse) {
            if (!fundsMap.has("Other")) {
                fundsMap.set("Other", []);
            }
            fundsMap.get("Other")!.push({
                schemeCode: item.schemeCode,
                schemeName: item.schemeName,
            });
        }
    });

    const fundsArray: Fund[] = [];
    fundsMap.forEach((schemes, fundName) => {
        // Only add fund houses that have schemes
        if (schemes.length > 0) {
            fundsArray.push({ fundName, schemes });
        }
    });

    // The array is already sorted by fund house name because we initialized the map in sorted order.
    // If "Other" exists, move it to the end.
    const otherIndex = fundsArray.findIndex(f => f.fundName === "Other");
    if (otherIndex > -1) {
        const otherFunds = fundsArray.splice(otherIndex, 1);
        fundsArray.push(otherFunds[0]);
    }

    return fundsArray;
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
