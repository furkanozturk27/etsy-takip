"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency, formatDate, convertToUSD, USD_TRY_RATE } from '@/lib/utils';
import { AlertTriangle, ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, Plus, Loader2, Calendar, CheckCircle2, X } from 'lucide-react';
import { Transaction, RecurringExpense } from '@/types';
import TransactionForm from '@/components/TransactionForm';
import { subDays, subMonths, startOfMonth, startOfYear, endOfMonth, endOfYear, isAfter, isBefore, startOfDay, format } from 'date-fns';

type DateFilter = '7days' | 'thisMonth' | '3months' | '6months' | 'thisYear' | 'all';

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false); // Modal State
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [autoProcessedNotification, setAutoProcessedNotification] = useState<{
    count: number;
    names: string[];
  } | null>(null);

  // React Strict Mode için flag (çift çalışmayı önler)
  const hasCheckedRecurring = useRef(false);

  // Verileri Çek
  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, stores(name), business_models(name)') // Join ile isimleri de alabiliriz
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions((data as any) || []);
    } catch (error) {
      console.error('Veri çekme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  // Otomatik Sabit Gider İşleme
  const processRecurringExpenses = async () => {
    // React Strict Mode'da çift çalışmayı önle
    if (hasCheckedRecurring.current) return;
    hasCheckedRecurring.current = true;

    try {
      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = today.getMonth() + 1; // 1-12
      const currentYear = today.getFullYear();

      // Aktif sabit giderleri çek
      const { data: recurringExpenses, error: recurringError } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('is_active', true);

      if (recurringError) {
        console.error('Recurring expenses fetch error:', recurringError);
        return;
      }

      if (!recurringExpenses || recurringExpenses.length === 0) return;

      const processedExpenses: string[] = [];

      for (const expense of recurringExpenses) {
        const expenseDate = expense.day_of_month;

        // Günü gelmiş veya geçmiş mi kontrol et
        if (expenseDate <= currentDay) {
          // Bu ay için bu recurring expense ile transaction var mı kontrol et
          const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
          const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');

          const { data: existingTransactions, error: checkError } = await supabase
            .from('transactions')
            .select('id')
            .eq('type', 'expense')
            .eq('category', expense.category)
            .gte('transaction_date', monthStart)
            .lte('transaction_date', monthEnd)
            .ilike('description', `%${expense.name}%`);

          if (checkError) {
            console.error('Transaction check error:', checkError);
            continue;
          }

          // Eğer bu ay için henüz eklenmemişse
          if (!existingTransactions || existingTransactions.length === 0) {
            // Exchange rate hesapla
            let exchangeRate = 1.0;
            if (expense.currency === 'TRY') {
              exchangeRate = USD_TRY_RATE;
            }
            
            // Transaction ekle
            const { error: insertError } = await supabase.from('transactions').insert({
              type: 'expense',
              amount: expense.amount,
              currency: expense.currency,
              exchange_rate: exchangeRate,
              category: expense.category,
              description: `${expense.name} (Otomatik Sabit Gider)`,
              transaction_date: format(today, 'yyyy-MM-dd'),
              store_id: null,
              business_model_id: null,
            });

            if (!insertError) {
              processedExpenses.push(expense.name);
            } else {
              console.error('Transaction insert error:', insertError);
            }
          }
        }
      }

      // Bildirim göster
      if (processedExpenses.length > 0) {
        setAutoProcessedNotification({
          count: processedExpenses.length,
          names: processedExpenses,
        });

        // 5 saniye sonra bildirimi kapat
        setTimeout(() => {
          setAutoProcessedNotification(null);
        }, 5000);
      }
    } catch (error) {
      console.error('Auto-process recurring expenses error:', error);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await fetchTransactions();
      await processRecurringExpenses();
      // İşlemler eklendikten sonra tekrar çek
      await fetchTransactions();
    };
    initialize();
  }, []);

  // Tarih filtresine göre işlemleri filtrele
  const filteredTransactions = useMemo(() => {
    if (dateFilter === 'all') return transactions;

    const now = new Date();
    let filterDate: Date;

    switch (dateFilter) {
      case '7days':
        filterDate = startOfDay(subDays(now, 7));
        break;
      case 'thisMonth':
        filterDate = startOfDay(startOfMonth(now));
        break;
      case '3months':
        filterDate = startOfDay(startOfMonth(subMonths(now, 3)));
        break;
      case '6months':
        filterDate = startOfDay(startOfMonth(subMonths(now, 6)));
        break;
      case 'thisYear':
        filterDate = startOfDay(startOfYear(now));
        break;
      default:
        return transactions;
    }

    return transactions.filter(t => {
      const tDate = new Date(t.transaction_date);
      return isAfter(tDate, filterDate) || tDate.getTime() === filterDate.getTime();
    });
  }, [transactions, dateFilter]);

  // Hesaplamalar (filtrelenmiş verilerden)
  const stats = useMemo<{
    income: number;
    expense: number;
    profit: number;
    margin: number;
    lastSaleDate: Date | null;
  }>(() => {
    let income = 0;
    let expense = 0;
    let lastSaleDate: Date | null = null; // Tipi Date | null olarak ayarla

    filteredTransactions.forEach(t => {
      const val = Number(t.amount);
      // Kur dönüşümü: USD ise direkt, değilse exchange_rate'e böl
      // exchange_rate yoksa (eski kayıt) ve TRY ise sabit kuru kullan
      const amountInUSD = t.currency === 'USD' 
        ? val 
        : val / (t.exchange_rate || (t.currency === 'TRY' ? USD_TRY_RATE : 1));
      
      if (t.type === 'income') {
        income += amountInUSD;
        const tDate = new Date(t.transaction_date);
        // Sadece geçerli bir tarihse güncelle
        if (tDate && tDate instanceof Date && !isNaN(tDate.getTime())) {
          if (!lastSaleDate || tDate > lastSaleDate) {
            lastSaleDate = tDate;
          }
        }
      } else {
        expense += amountInUSD;
      }
    });

    return {
      income,
      expense,
      profit: income - expense,
      margin: income > 0 ? ((income - expense) / income) * 100 : 0,
      lastSaleDate // Tipi Date | null
    };
  }, [filteredTransactions]);

  // 10 Gün Kuralı
  const daysSinceLastSale = stats.lastSaleDate
    ? Math.floor(
        (new Date().getTime() - stats.lastSaleDate!.getTime()) / (1000 * 3600 * 24)
      )
    : 999;

  const isUrgent = daysSinceLastSale > 10;

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-muted-foreground gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p>Finansal veriler analiz ediliyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* BAŞLIK & EKLE BUTONU */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Genel Bakış</h2>
          <p className="text-muted-foreground">İmparatorluğun güncel durumu.</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-card px-4 py-2 rounded-full border">
                <span className="text-sm text-muted-foreground">Bugün:</span>
                <span className="font-mono font-bold">{formatDate(new Date().toISOString())}</span>
            </div>
            <button 
                onClick={() => setIsFormOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
            >
                <Plus className="w-5 h-5" />
                Yeni İşlem Ekle
            </button>
        </div>
      </div>

      {/* TARİH FİLTRESİ */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <label className="text-sm font-medium text-muted-foreground">Dönem:</label>
        </div>
        <select 
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as DateFilter)}
          className="bg-background border border-border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="7days">Son 7 Gün</option>
          <option value="thisMonth">Bu Ay</option>
          <option value="3months">Son 3 Ay</option>
          <option value="6months">Son 6 Ay</option>
          <option value="thisYear">Bu Yıl</option>
          <option value="all">Tüm Zamanlar</option>
        </select>
      </div>

      {/* OTOMATIK İŞLEME BİLDİRİMİ */}
      {autoProcessedNotification && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-start gap-3 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-primary">
              {autoProcessedNotification.count} adet sabit gider güncel döneme işlendi.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {autoProcessedNotification.names.slice(0, 3).join(', ')}
              {autoProcessedNotification.names.length > 3 && ` ve ${autoProcessedNotification.names.length - 3} adet daha`}
            </p>
          </div>
          <button
            onClick={() => setAutoProcessedNotification(null)}
            className="p-1 hover:bg-primary/20 rounded transition-colors"
          >
            <X className="w-4 h-4 text-primary" />
          </button>
        </div>
      )}

      {/* KRİTİK UYARI SİSTEMİ */}
      {isUrgent && stats.lastSaleDate && (
        <div className="bg-destructive/10 border-l-4 border-destructive p-4 rounded-r-lg flex items-start gap-4 animate-urgent-pulse">
          <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-bold text-red-500">ACİL DURUM: {daysSinceLastSale} Gündür Satış Yok!</h3>
            <p className="text-red-400/80 text-sm">
              Mağazalar trafik almıyor olabilir. Reklamları kontrol et veya yeni ürün gir. 
            </p>
          </div>
        </div>
      )}

      {/* FİNANSAL KARTLAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border p-6 rounded-xl shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-24 h-24" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Net Kâr</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-4xl font-bold ${stats.profit >= 0 ? 'text-income' : 'text-expense'}`}>
              {formatCurrency(stats.profit)}
            </span>
            <span className={`text-sm font-medium ${stats.margin >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              %{stats.margin.toFixed(1)} Marj
            </span>
          </div>
        </div>

        <div className="bg-card border p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Toplam Gelir</p>
              <h3 className="text-2xl font-bold mt-2">{formatCurrency(stats.income)}</h3>
            </div>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <ArrowUpRight className="w-5 h-5 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-card border p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Toplam Gider</p>
              <h3 className="text-2xl font-bold mt-2">{formatCurrency(stats.expense)}</h3>
            </div>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <ArrowDownRight className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* SON İŞLEMLER TABLOSU */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Son Hareketler
          </h3>
        </div>
        <div className="relative w-full overflow-auto">
            {filteredTransactions.length === 0 ? (
                 <div className="p-8 text-center text-muted-foreground">
                   {transactions.length === 0 ? 'Henüz işlem kaydı yok.' : 'Seçili dönemde işlem bulunamadı.'}
                 </div>
            ) : (
                <table className="w-full text-sm text-left">
                <thead className="text-muted-foreground bg-muted/50 uppercase text-xs">
                    <tr>
                    <th className="px-6 py-3">Tarih</th>
                    <th className="px-6 py-3">Kategori</th>
                    <th className="px-6 py-3">Açıklama</th>
                    <th className="px-6 py-3">İşlem</th>
                    <th className="px-6 py-3 text-right">Tutar</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {filteredTransactions.slice(0, 10).map((t) => {
                      // Otomatik Sabit Gider kontrolü (description'da "(Otomatik Sabit Gider)" varsa)
                      const isRecurring = t.description?.includes('(Otomatik Sabit Gider)') || false;
                      
                      return (
                      <tr 
                        key={t.id} 
                        className={`transition-colors ${
                          isRecurring
                            ? 'bg-yellow-500/10 hover:bg-yellow-500/20 border-l-4 border-l-yellow-500'
                            : t.type === 'income' 
                              ? 'bg-green-500/5 hover:bg-green-500/10 border-l-4 border-l-green-500' 
                              : 'bg-red-500/5 hover:bg-red-500/10 border-l-4 border-l-red-500'
                        }`}
                      >
                          <td className="px-6 py-4 font-medium">{formatDate(t.transaction_date)}</td>
                          <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-full bg-secondary text-xs border">
                              {t.category}
                          </span>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground truncate max-w-[200px]">
                              {t.description || '-'}
                          </td>
                          <td className="px-6 py-4">
                          {t.type === 'income' ? 'Gelir' : 'Gider'}
                          </td>
                          <td className={`px-6 py-4 text-right font-bold ${
                            isRecurring 
                              ? 'text-yellow-500' 
                              : t.type === 'income' 
                                ? 'text-green-500' 
                                : 'text-red-500'
                          }`}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, t.currency)}
                          </td>
                      </tr>
                      );
                    })}
                </tbody>
                </table>
            )}
        </div>
      </div>

      {/* FORM MODAL */}
      <TransactionForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSuccess={fetchTransactions} 
      />

    </div>
  );
}
