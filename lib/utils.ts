import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Statik USD/TRY kuru (güncel kur değeri)
export const USD_TRY_RATE = 34.50; // Örnek: 1 USD = 34.50 TRY

// Para birimini USD'ye çevir (Base Currency)
export function convertToUSD(amount: number, currency: string, exchangeRate?: number): number {
  if (currency === 'USD') {
    return amount;
  }
  
  // Eğer exchange_rate verilmişse onu kullan, yoksa statik kuru kullan
  if (exchangeRate && exchangeRate !== 1.0) {
    return amount / exchangeRate;
  }
  
  // Statik kur kullan (sadece TRY için)
  if (currency === 'TRY') {
    return amount / USD_TRY_RATE;
  }
  
  // Diğer para birimleri için varsayılan olarak 1:1 kabul et (ileride genişletilebilir)
  return amount;
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return format(date, 'dd MMM yyyy')
  } catch {
    return dateString
  }
}

