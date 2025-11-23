"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { X, Loader2, Save } from 'lucide-react';
import { Store, BusinessModel, Category } from '@/types';
import { USD_TRY_RATE } from '@/lib/utils';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransactionForm({ isOpen, onClose, onSuccess }: TransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false); // Dropdown verileri yükleniyor mu?
  const [stores, setStores] = useState<Store[]>([]);
  const [allModels, setAllModels] = useState<BusinessModel[]>([]); // Tüm modeller
  const [categories, setCategories] = useState<Category[]>([]); // Kategoriler
  
  // Form State
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [category, setCategory] = useState('');
  const [storeId, setStoreId] = useState('');
  const [modelId, setModelId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Dropdown verilerini çek (Her açılışta taze veri)
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setDataLoading(true);
        try {
          // Mağazaları Çek
          const { data: storesData, error: storeError } = await supabase.from('stores').select('*').order('name');
          if (storeError) console.error("Store Fetch Error:", storeError);
          
          // İş Modellerini Çek
          const { data: modelsData, error: modelError } = await supabase.from('business_models').select('*').order('name');
          if (modelError) console.error("Model Fetch Error:", modelError);

          // Kategorileri Çek
          const { data: categoriesData, error: categoryError } = await supabase
            .from('categories')
            .select('*')
            .order('name');
          if (categoryError) console.error("Category Fetch Error:", categoryError);

          if (storesData) {
            setStores(storesData as any);
            // Eğer daha önce seçili bir mağaza yoksa ilkini seç
            if (!storeId && storesData.length > 0) setStoreId(storesData[0].id);
          }

          if (modelsData) {
            setAllModels(modelsData as any);
            // Model seçimi zorunlu değil, o yüzden otomatik seçmeye gerek yok ama state'i güncelle
          }

          if (categoriesData) {
            setCategories(categoriesData as any);
            // Kategori varsayılanını ayarla
            if (!category) {
              const defaultCategory = categoriesData.find(
                c => (type === 'income' && (c.type === 'income' || c.type === 'both')) ||
                     (type === 'expense' && (c.type === 'expense' || c.type === 'both'))
              );
              if (defaultCategory) {
                setCategory(defaultCategory.name);
              }
            }
          }

        } catch (error) {
          console.error("Veri çekme hatası:", error);
        } finally {
          setDataLoading(false);
        }
      };
      
      fetchData();
    }
  }, [isOpen, type]); // type değişince de tetiklensin ki kategori güncellensin

  // İş modellerini type'a göre filtrele
  const filteredModels = allModels.filter(model => {
    if (type === 'income') {
      return model.type === 'income' || model.type === 'both';
    } else {
      return model.type === 'expense' || model.type === 'both';
    }
  });

  // Kategorileri type'a göre filtrele
  const filteredCategories = categories.filter(cat => {
    if (type === 'income') {
      return cat.type === 'income' || cat.type === 'both';
    } else {
      return cat.type === 'expense' || cat.type === 'both';
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amountValue = parseFloat(amount);
      let exchangeRate = 1.0; // USD için varsayılan
      let amountBaseCurrency = amountValue; // USD cinsinden tutar

      // Eğer para birimi TRY ise, kuru hesapla ve USD'ye çevir
      if (currency === 'TRY') {
        exchangeRate = USD_TRY_RATE;
        amountBaseCurrency = amountValue / exchangeRate;
      }

      const { error } = await supabase.from('transactions').insert({
        type,
        amount: amountValue,
        currency,
        exchange_rate: exchangeRate,
        category,
        store_id: storeId,
        business_model_id: modelId || null, // Boş string ise null gönder
        description,
        transaction_date: date,
      });

      if (error) throw error;
      onSuccess();
      onClose();
      // Reset form (opsiyonel)
      setAmount('');
      setDescription('');
    } catch (error: any) {
      console.error('Kaydetme hatası:', error);
      alert('Kaydedilirken bir hata oluştu: ' + (error?.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border bg-muted/20">
          <h2 className="text-xl font-bold">Yeni İşlem Ekle</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => { 
                setType('income');
                // İlk uygun kategoriyi seç
                const firstIncomeCategory = categories.find(c => c.type === 'income' || c.type === 'both');
                if (firstIncomeCategory) setCategory(firstIncomeCategory.name);
                setModelId(''); // Type değişince model seçimini sıfırla
              }}
              className={`py-2 text-sm font-medium rounded-md transition-all ${type === 'income' ? 'bg-green-600 text-white shadow' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Gelir (Income)
            </button>
            <button
              type="button"
              onClick={() => { 
                setType('expense');
                // İlk uygun kategoriyi seç
                const firstExpenseCategory = categories.find(c => c.type === 'expense' || c.type === 'both');
                if (firstExpenseCategory) setCategory(firstExpenseCategory.name);
                setModelId(''); // Type değişince model seçimini sıfırla
              }}
              className={`py-2 text-sm font-medium rounded-md transition-all ${type === 'expense' ? 'bg-red-600 text-white shadow' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Gider (Expense)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Tutar</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-lg font-bold focus:ring-2 focus:ring-primary outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Para Birimi</label>
              <select 
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="USD">USD ($)</option>
                <option value="TRY">TRY (₺)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          {/* Kur Oranı Bilgisi */}
          {currency === 'TRY' && (
            <div className="bg-muted/50 border border-border rounded-lg p-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Kur Oranı:</span>
                <span className="font-mono font-semibold">1 USD = {USD_TRY_RATE.toFixed(2)} TRY</span>
              </div>
              {amount && !isNaN(parseFloat(amount)) && (
                <div className="mt-2 flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">USD Karşılığı:</span>
                  <span className="font-mono font-semibold text-primary">
                    ${(parseFloat(amount) / USD_TRY_RATE).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Kategori</label>
              {dataLoading ? (
                <div className="h-10 w-full bg-muted animate-pulse rounded-lg" />
              ) : (
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  {filteredCategories.length === 0 && <option value="">Kategori Bulunamadı</option>}
                  {filteredCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Tarih</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* MAĞAZA SEÇİMİ */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Mağaza</label>
              {dataLoading ? (
                <div className="h-10 w-full bg-muted animate-pulse rounded-lg" />
              ) : (
                <select 
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                >
                  {stores.length === 0 && <option value="">Mağaza Bulunamadı</option>}
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>

            {/* İŞ MODELİ SEÇİMİ */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">İş Modeli</label>
               {dataLoading ? (
                <div className="h-10 w-full bg-muted animate-pulse rounded-lg" />
              ) : (
                <select 
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Seçiniz...</option>
                  {filteredModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Açıklama (Opsiyonel)</label>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Örn: 50 adet minder kumaşı"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {type === 'income' ? 'Geliri Kaydet' : 'Gideri Kaydet'}
          </button>

        </form>
      </div>
    </div>
  );
}
