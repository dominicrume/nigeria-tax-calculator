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

  // Define modelName here so it is available in catch block
  let modelName = 'gemini-flash-latest'; 

  try {
    // Remove header data if present
    const cleanBase64 = base64Data.split(',')[1] || base64Data;
    
    // Check approximate size (Base64 is ~1.33x original size)
    const approximateSizeInMB = (cleanBase64.length * 0.75) / (1024 * 1024);
    
    // 1. Model Selection
    // 'gemini-flash-latest' for speed.
    // 'gemini-3-pro-preview' for reasoning/large context.
    
    // AUTO-SCALING: If file is larger than 10MB (likely complex or many pages), force Pro model.
    // Also use Pro if user explicitly selected Grok/Pro.
    if (approximateSizeInMB > 10 || provider === ModelProvider.GEMINI_PRO || provider === ModelProvider.GROK_BETA) {
      console.log("Large document detected or Pro mode selected. Switching to Gemini Pro for high-context analysis.");
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
            text: `You are a Federal Auditor extraction engine. Analyze this bank statement.

            CRITICAL INSTRUCTION: This document may contain UP TO 500 PAGES. 
            You must extract transactions from PAGE 1 all the way to the LAST PAGE.
            Do NOT stop after the first page. Do NOT summarize.
            
            Scan the entire document. If you see "Page 1 of 500", ensure you reach Page 500.
            
            TASK: Extract all financial transactions into a single JSON array.
            
            FIELDS:
            - date: "YYYY-MM-DD" (Use the date of the transaction)
            - description: String (Clean up codes, remove timestamps if mixed in)
            - amount: Number (Positive value, no currency symbols)
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
      console.warn("The AI engine returned an empty response after retrying. Returning empty transaction list.");
      return [];
    }

    // 3. Robust Parsing
    try {
      let cleanJson = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();

      // JSON Repair Strategy:
      if (cleanJson.startsWith('[') && !cleanJson.endsWith(']')) {
        const lastClosingBrace = cleanJson.lastIndexOf('}');
        if (lastClosingBrace !== -1) {
           console.warn("Response truncated. Repairing JSON...");
           cleanJson = cleanJson.substring(0, lastClosingBrace + 1) + ']';
        }
      }

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
        friendlyMessage = "Engine Error: The selected model is not available. Please try switching between Flash and Grok/Pro.";
    } else if (errStr.includes("quota") || errStr.includes("429")) {
        friendlyMessage = "Traffic limit exceeded. Retrying automatically usually fixes this.";
    } else if (errStr.includes("too large") || errStr.includes("payload") || errStr.includes("413")) {
        // Handle payload limits specifically
        friendlyMessage = "The document size exceeds the secure transmission limit (20MB encoded). Please try compressing your PDF or converting to grayscale to reduce size.";
    } else if (errStr.includes("token count") || errStr.includes("limit")) {
         friendlyMessage = "This document is extremely dense. We have automatically switched to High-Capacity mode, but it may still be too large. Please split the PDF.";
    } else if (errStr.includes("dependency") || errStr.includes("internal")) {
        friendlyMessage = "The document structure is too complex for the engine. Please try converting to an Image or creating a simpler PDF.";
    }

    // Prefix for Grok to maintain branding
    if (provider === ModelProvider.GROK_BETA || modelName === 'gemini-3-pro-preview') {
        friendlyMessage = `[Pro Audit] ${friendlyMessage}`;
    }

    throw new Error(friendlyMessage);
  }
};