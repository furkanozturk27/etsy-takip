"use client";

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Loader2, Trash2, Wallet, ArrowUpRight, ArrowDownRight, DollarSign, Filter } from 'lucide-react';
import { Transaction, Store, BusinessModel } from '@/types';
import TransactionForm from '@/components/TransactionForm';
import { startOfMonth, endOfMonth, subMonths, subDays, startOfYear, startOfDay, endOfDay } from 'date-fns';

type DateRangeFilter = 'last_7_days' | 'thisMonth' | 'lastMonth' | 'last3Months' | 'last_6_months' | 'this_year' | 'all';
type TypeFilter = 'all' | 'income' | 'expense';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [models, setModels] = useState<BusinessModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Filtreler
  const [dateRange, setDateRange] = useState<DateRangeFilter>('thisMonth');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [modelFilter, setModelFilter] = useState<string>('all');

  // Tarih aralığı hesaplama
  const getDateRange = (range: DateRangeFilter) => {
    const now = new Date();
    switch (range) {
      case 'last_7_days':
        return {
          from: startOfDay(subDays(now, 7)),
          to: endOfDay(now),
        };
      case 'thisMonth':
        return {
          from: startOfDay(startOfMonth(now)),
          to: endOfDay(endOfMonth(now)),
        };
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        return {
          from: startOfDay(startOfMonth(lastMonth)),
          to: endOfDay(endOfMonth(lastMonth)),
        };
      case 'last3Months':
        return {
          from: startOfDay(startOfMonth(subMonths(now, 3))),
          to: endOfDay(endOfMonth(now)),
        };
      case 'last_6_months':
        return {
          from: startOfDay(startOfMonth(subMonths(now, 6))),
          to: endOfDay(endOfMonth(now)),
        };
      case 'this_year':
        return {
          from: startOfDay(startOfYear(now)),
          to: endOfDay(now),
        };
      case 'all':
        return null; // Tarih filtresi yok
      default:
        return null;
    }
  };

  // Verileri Çek
  const fetchData = async () => {
    try {
      setLoading(true);

      // Stores ve Models çek
      const [storesRes, modelsRes] = await Promise.all([
        supabase.from('stores').select('*'),
        supabase.from('business_models').select('*'),
      ]);

      if (storesRes.data) setStores(storesRes.data as any);
      if (modelsRes.data) setModels(modelsRes.data as any);

      // Transactions sorgusu oluştur
      let query = supabase
        .from('transactions')
        .select('*, store:stores(name), business_model:business_models(name)')
        .order('transaction_date', { ascending: false });

      // Tarih filtresi
      const dateRangeFilter = getDateRange(dateRange);
      if (dateRangeFilter) {
        query = query
          .gte('transaction_date', dateRangeFilter.from.toISOString().split('T')[0])
          .lte('transaction_date', dateRangeFilter.to.toISOString().split('T')[0]);
      }

      // Tür filtresi
      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      // Mağaza filtresi
      if (storeFilter !== 'all') {
        query = query.eq('store_id', storeFilter);
      }

      // İş modeli filtresi
      if (modelFilter !== 'all') {
        query = query.eq('business_model_id', modelFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions((data as any) || []);
    } catch (error) {
      console.error('Veri çekme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange, typeFilter, storeFilter, modelFilter]);

  // Özet hesaplamalar (filtrelenmiş verilerden)
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;

    transactions.forEach(t => {
      const val = Number(t.amount);
      if (t.type === 'income') {
        income += val;
      } else {
        expense += val;
      }
    });

    return {
      income,
      expense,
      profit: income - expense,
    };
  }, [transactions]);

  // Silme
  const handleDelete = async (id: string) => {
    if (!confirm('Bu işlemi silmek istediğinize emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silinirken bir hata oluştu.');
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-muted-foreground gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p>İşlemler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* BAŞLIK & EKLE BUTONU */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Wallet className="w-8 h-8 text-primary" />
            Gelir & Gider Geçmişi
          </h2>
          <p className="text-muted-foreground mt-2">Tüm işlemlerinizi filtreleyin ve analiz edin.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Yeni İşlem Ekle
        </button>
      </div>

      {/* FİLTRE BAR */}
      <div className="bg-card border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filtreler</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Tarih Aralığı</label>
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRangeFilter)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="last_7_days">Son 7 Gün</option>
              <option value="thisMonth">Bu Ay</option>
              <option value="lastMonth">Geçen Ay</option>
              <option value="last3Months">Son 3 Ay</option>
              <option value="last_6_months">Son 6 Ay</option>
              <option value="this_year">Bu Yıl</option>
              <option value="all">Tüm Zamanlar</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Tür</label>
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tümü</option>
              <option value="income">Gelir</option>
              <option value="expense">Gider</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Mağaza</label>
            <select 
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tümü</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">İş Modeli</label>
            <select 
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tümü</option>
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ÖZET KARTLAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Seçili Dönem Geliri</p>
              <h3 className="text-2xl font-bold text-income">{formatCurrency(summary.income)}</h3>
            </div>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <ArrowUpRight className="w-5 h-5 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-card border p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Seçili Dönem Gideri</p>
              <h3 className="text-2xl font-bold text-expense">{formatCurrency(summary.expense)}</h3>
            </div>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <ArrowDownRight className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-card border p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Net Durum</p>
              <h3 className={`text-2xl font-bold ${summary.profit >= 0 ? 'text-income' : 'text-expense'}`}>
                {formatCurrency(summary.profit)}
              </h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className={`w-5 h-5 ${summary.profit >= 0 ? 'text-income' : 'text-expense'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* VERİ TABLOSU */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-semibold text-lg">İşlemler ({transactions.length})</h3>
        </div>
        <div className="relative w-full overflow-auto">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Seçili filtrelerle eşleşen işlem bulunamadı.
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-muted-foreground bg-muted/50 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Tarih</th>
                  <th className="px-6 py-3">Mağaza</th>
                  <th className="px-6 py-3">Model</th>
                  <th className="px-6 py-3">Kategori</th>
                  <th className="px-6 py-3">Açıklama</th>
                  <th className="px-6 py-3 text-right">Tutar</th>
                  <th className="px-6 py-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((t) => {
                  // Otomatik Sabit Gider kontrolü (description'da "(Otomatik Sabit Gider)" varsa)
                  const isRecurring = t.description?.includes('(Otomatik Sabit Gider)') || false;
                  
                  return (
                  <tr 
                    key={t.id} 
                    className={`transition-colors ${
                      isRecurring
                        ? 'bg-yellow-500/10 hover:bg-yellow-500/20 border-l-4 border-l-yellow-500'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <td className="px-6 py-4 font-medium">{formatDate(t.transaction_date)}</td>
                    <td className="px-6 py-4">
                      <span className="text-muted-foreground">
                        {(t.store as any)?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-muted-foreground">
                        {(t.business_model as any)?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full bg-secondary text-xs border">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground truncate max-w-[200px]">
                      {t.description || '-'}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${
                      isRecurring 
                        ? 'text-yellow-500' 
                        : t.type === 'income' 
                          ? 'text-income' 
                          : 'text-expense'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, t.currency)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
        onSuccess={fetchData} 
      />

    </div>
  );
}

