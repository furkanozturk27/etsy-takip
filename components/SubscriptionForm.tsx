"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { X, Loader2, Save } from 'lucide-react';
import { RecurringExpense } from '@/types';

interface SubscriptionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: RecurringExpense | null;
}

export default function SubscriptionForm({ isOpen, onClose, onSuccess, initialData }: SubscriptionFormProps) {
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [category, setCategory] = useState('Software');
  const [interval, setInterval] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [isActive, setIsActive] = useState(true);

  // Form'u initialData ile doldur
  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name);
      setAmount(initialData.amount.toString());
      setCurrency(initialData.currency);
      setDayOfMonth(initialData.day_of_month.toString());
      setCategory(initialData.category);
      setInterval(initialData.interval || 'monthly');
      setIsActive(initialData.is_active);
    } else if (isOpen && !initialData) {
      // Yeni ekleme modunda formu sıfırla
      setName('');
      setAmount('');
      setCurrency('USD');
      setDayOfMonth('1');
      setCategory('Software');
      setInterval('monthly');
      setIsActive(true);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (initialData) {
        // Update işlemi
        const { error } = await supabase
          .from('recurring_expenses')
          .update({
            name,
            amount: parseFloat(amount),
            currency,
            day_of_month: parseInt(dayOfMonth),
            category,
            interval,
            is_active: isActive,
          })
          .eq('id', initialData.id);

        if (error) throw error;
      } else {
        // Insert işlemi
        const { error } = await supabase.from('recurring_expenses').insert({
          name,
          amount: parseFloat(amount),
          currency,
          day_of_month: parseInt(dayOfMonth),
          category,
          interval,
          is_active: isActive,
        });

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Hata:', error);
      alert('Kaydedilirken bir hata oluştu.');
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
          <h2 className="text-xl font-bold">{initialData ? 'Aboneliği Düzenle' : 'Yeni Abonelik Ekle'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">İsim</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Canva, Midjourney, Netflix"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Ödeme Günü (Ayın Kaçı?)</label>
              <input 
                type="number" 
                min="1"
                max="31"
                required
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                placeholder="1-31"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Kategori</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Software">Yazılım & Üyelik</option>
                <option value="Service">Hizmet</option>
                <option value="Tax">Vergi</option>
                <option value="Rent">Kira</option>
                <option value="Other">Diğer</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Ödeme Sıklığı</label>
            <select 
              value={interval}
              onChange={(e) => setInterval(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="daily">Günlük</option>
              <option value="weekly">Haftalık</option>
              <option value="monthly">Aylık</option>
              <option value="yearly">Yıllık</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
              Aktif (Bu abonelik şu anda ödeniyor)
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {initialData ? 'Güncelle' : 'Aboneliği Kaydet'}
          </button>

        </form>
      </div>
    </div>
  );
}
