"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { X, Loader2, Save } from 'lucide-react';
import { Store } from '@/types';

interface StoreFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingStore?: Store | null;
}

export default function StoreForm({ isOpen, onClose, onSuccess, editingStore }: StoreFormProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('Etsy');
  const [currency, setCurrency] = useState('USD');

  // Form'u düzenleme modunda doldur
  useEffect(() => {
    if (isOpen && editingStore) {
      setName(editingStore.name);
      setPlatform(editingStore.platform);
      setCurrency(editingStore.currency);
    } else if (isOpen && !editingStore) {
      // Yeni ekleme modunda formu sıfırla
      setName('');
      setPlatform('Etsy');
      setCurrency('USD');
    }
  }, [isOpen, editingStore]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingStore) {
        // Update işlemi
        const { error } = await supabase
          .from('stores')
          .update({
            name,
            platform,
            currency,
          })
          .eq('id', editingStore.id);

        if (error) throw error;
      } else {
        // Insert işlemi
        const { error } = await supabase.from('stores').insert({
          name,
          platform,
          currency,
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
      <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border bg-muted/20">
          <h2 className="text-xl font-bold">{editingStore ? 'Mağazayı Düzenle' : 'Yeni Mağaza Ekle'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Mağaza Adı</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Vintage Minder Mağazam"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Platform</label>
              <select 
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Etsy">Etsy</option>
                <option value="Amazon">Amazon</option>
                <option value="Shopify">Shopify</option>
                <option value="Other">Diğer</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Para Birimi</label>
              <select 
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="USD">USD ($)</option>
                <option value="TRY">TRY (₺)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {editingStore ? 'Güncelle' : 'Mağazayı Kaydet'}
          </button>

        </form>
      </div>
    </div>
  );
}
