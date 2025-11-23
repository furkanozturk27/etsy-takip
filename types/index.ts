// types/index.ts
// Etsy Takip PWA - TypeScript Type Definitions

export type TransactionType = 'income' | 'expense';
export type Currency = 'USD' | 'TRY' | 'EUR' | 'GBP';
export type ProductStatus = 'idea' | 'todo' | 'in_progress' | 'live' | 'abandoned';

export interface Store {
  id: string;
  name: string;
  platform: string;
  currency: Currency;
  created_at: string;
}

export interface BusinessModel {
  id: string;
  name: string; // 'POD' | 'Physical' | 'Digital'
  description?: string;
  type: 'income' | 'expense' | 'both';
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'both';
  created_at: string;
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  day_of_month: number;
  category: string;
  is_active: boolean;
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  created_at: string;
}

export interface Transaction {
  id: string;
  store_id?: string | null; // Null ise genel gider olabilir
  business_model_id?: string | null;
  type: TransactionType;
  amount: number;
  currency: Currency;
  exchange_rate?: number;
  category: string;
  description?: string;
  transaction_date: string; // ISO Date string
  created_at: string;
  
  // UI için joinlenmiş veriler (Optional)
  store?: Store;
  business_model?: BusinessModel;
}

export interface ProductIdea {
  id: string;
  store_id: string;
  title: string;
  description?: string;
  expectation_score: number; // 1-10
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  
  // UI için joinlenmiş veriler (Optional)
  store?: Store;
}

// --- DASHBOARD & REPORTING TYPES ---

export interface DateRange {
  from: Date;
  to: Date;
}

export interface FinancialSummary {
  total_income: number;
  total_expense: number;
  net_profit: number;
  margin_percentage: number;
  last_sale_date?: string; // For the "10 days alert"
  days_since_last_sale: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

// Filtreleme State'i için
export interface DashboardFilter {
  dateRange: '7days' | 'weekly' | '30days' | '3months' | '6months' | 'yearly' | 'all' | 'custom';
  customDateRange?: DateRange;
  storeId?: string | 'all';
  businessModelId?: string | 'all';
}

// Profitability Report için detaylı tip
export interface ProfitabilityReport {
  period: DateRange;
  byStore: {
    store: Store;
    income: number;
    expense: number;
    profit: number;
    margin: number;
  }[];
  byBusinessModel: {
    business_model: BusinessModel;
    income: number;
    expense: number;
    profit: number;
    margin: number;
  }[];
  categoryBreakdown: CategoryBreakdown[];
  summary: FinancialSummary;
}

