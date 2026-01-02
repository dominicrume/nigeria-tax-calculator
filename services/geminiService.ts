import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Transaction, TransactionType, TaxBreakdown, ModelProvider } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Calculates Nigerian Personal Income Tax (PIT) based on Gross Income.
 * Includes Consolidated Relief Allowance (CRA).
 */
export const calculateNigerianPIT = (grossIncome: number): TaxBreakdown => {
  // 1. Calculate Consolidated Relief Allowance (CRA)
  // Higher of N200,000 or 1% of Gross Income, PLUS 20% of Gross Income
  const baseRelief = Math.max(200000, grossIncome * 0.01);
  const variableRelief = grossIncome * 0.20;
  const consolidatedRelief = baseRelief + variableRelief;

  // 2. Taxable Income
  const taxableIncome = Math.max(0, grossIncome - consolidatedRelief);

  // 3. Apply Tax Bands (Finance Act)
  let tax = 0;
  let remaining = taxableIncome;

  const bands = [
    { limit: 300000, rate: 0.07 },
    { limit: 300000, rate: 0.11 },
    { limit: 500000, rate: 0.15 },
    { limit: 500000, rate: 0.19 },
    { limit: 1600000, rate: 0.21 },
    { limit: Infinity, rate: 0.24 },
  ];

  for (const band of bands) {
    if (remaining <= 0) break;
    const taxableAtThisBand = Math.min(remaining, band.limit);
    tax += taxableAtThisBand * band.rate;
    remaining -= taxableAtThisBand;
  }

  return {
    grossIncome,
    consolidatedRelief,
    taxableIncome,
    totalTax: tax,
    effectiveRate: grossIncome > 0 ? (tax / grossIncome) * 100 : 0
  };
};

/**
 * Extracts transactions from an image or PDF using Gemini.
 * Implements retry logic and stable model selection.
 */
export const extractTransactionsFromDocument = async (
  base64Data: string, 
  mimeType: string,
  provider: ModelProvider = ModelProvider.GEMINI_FLASH,
  retryCount = 0
): Promise<Transaction[]> => {
  
  // 0. Pre-check API Key
  if (!process.env.API_KEY) {
     throw new Error("System Configuration Error: API Key is missing.");
  }

  try {
    // Remove header data if present
    const cleanBase64 = base64Data.split(',')[1] || base64Data;

    // 1. Model Selection
    // STRICTLY using models allowed by the environment to avoid 404 errors.
    // 'gemini-flash-latest' for speed.
    // 'gemini-3-pro-preview' for reasoning/large context.
    let modelName = 'gemini-flash-latest'; 
    
    if (provider === ModelProvider.GEMINI_PRO || provider === ModelProvider.GROK_BETA) {
      modelName = 'gemini-3-pro-preview'; 
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType, 
              data: cleanBase64
            }
          },
          {
            text: `You are a data extraction engine. Analyze this bank statement image/pdf.

            TASK: Extract all financial transactions.
            OUTPUT: A strict JSON array. No markdown, no explanations.
            
            FIELDS:
            - date: "YYYY-MM-DD"
            - description: String (Clean up codes)
            - amount: Number (Positive value)
            - type: "CREDIT" (Inflow/Deposit) or "DEBIT" (Outflow/Withdrawal)

            If the document is unclear or contains no transactions, return an empty array [].`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              description: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              type: { type: Type.STRING, enum: [TransactionType.CREDIT, TransactionType.DEBIT] }
            },
            required: ["date", "description", "amount", "type"]
          }
        },
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
      }
    });

    const jsonText = response.text;
    
    // 2. Retry Logic for Empty Responses (High Liquidity)
    if (!jsonText) {
      if (retryCount < 1) {
        console.warn("Received empty response, retrying...");
        return extractTransactionsFromDocument(base64Data, mimeType, provider, retryCount + 1);
      }
      // If still empty, it's likely a blank document or completely blocked.
      // Return empty array instead of crashing, but log it.
      console.warn("The AI engine returned an empty response after retrying. Returning empty transaction list.");
      return [];
    }

    // 3. Robust Parsing
    try {
      // Remove any potential markdown formatting that slips through
      const cleanJson = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson) as Transaction[];
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, jsonText);
      throw new Error("Failed to parse the financial data. The document might be illegible.");
    }

  } catch (error: any) {
    console.error("Extraction Error:", error);
    
    const errStr = (error.message || error.toString()).toLowerCase();
    let friendlyMessage = "Failed to process document.";

    // 4. Detailed Error Mapping
    if (errStr.includes("api key") || errStr.includes("403")) {
        friendlyMessage = "Access Denied: Invalid or Missing API Key.";
    } else if (errStr.includes("404") || errStr.includes("not found")) {
        friendlyMessage = "Engine Error: The selected model is not available. Please try switching between Flash and Grok.";
    } else if (errStr.includes("quota") || errStr.includes("429")) {
        friendlyMessage = "Traffic limit exceeded. Retrying automatically usually fixes this.";
    } else if (errStr.includes("token count") || errStr.includes("1048576") || errStr.includes("too large")) {
        // Specifically handle token limits
        if (provider === ModelProvider.GEMINI_FLASH) {
          friendlyMessage = "This document is too large for the Flash engine. Please switch to 'Grok (Beta)' for higher capacity.";
        } else {
          friendlyMessage = "This document exceeds the 2 Million token limit. Please split the PDF.";
        }
    } else if (errStr.includes("dependency") || errStr.includes("internal")) {
        friendlyMessage = "The document structure is too complex for the engine. Please try converting to an Image or creating a simpler PDF.";
    } else if (errStr.includes("security") || errStr.includes("blocked")) {
        friendlyMessage = "The document was flagged by security filters. Try a different file.";
    }

    // Prefix for Grok to maintain branding
    if (provider === ModelProvider.GROK_BETA) {
        friendlyMessage = `[Grok Beta] ${friendlyMessage}`;
    }

    throw new Error(friendlyMessage);
  }
};
