export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT'
}

export enum ModelProvider {
  GEMINI_FLASH = 'Gemini Flash (Fast)',
  GEMINI_PRO = 'Gemini Pro (Reasoning)',
  GROK_BETA = 'Grok (Beta)'
}

export interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
}

export interface TaxBreakdown {
  grossIncome: number;
  consolidatedRelief: number;
  taxableIncome: number;
  totalTax: number;
  effectiveRate: number;
}

export interface AnalysisResult {
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  taxDetails: TaxBreakdown;
}
