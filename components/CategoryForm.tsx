"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { X, Loader2, Save } from 'lucide-react';
import { Category } from '@/types';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingCategory?: Category | null;
}

export default function CategoryForm({ isOpen, onClose, onSuccess, editingCategory }: CategoryFormProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense' | 'both'>('expense');

  // Form'u düzenleme modunda doldur
  useEffect(() => {
    if (isOpen && editingCategory) {
      setName(editingCategory.name);
      setType(editingCategory.type);
    } else if (isOpen && !editingCategory) {
      // Yeni ekleme modunda formu sıfırla
      setName('');
      setType('expense');
    }
  }, [isOpen, editingCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingCategory) {
        // Update işlemi
        const { error } = await supabase
          .from('categories')
          .update({
            name,
            type,
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        // Insert işlemi
        const { error } = await supabase.from('categories').insert({
          name,
          type,
        });

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Hata:', error);
      alert('Kaydedilirken bir hata oluştu: ' + (error?.message || 'Bilinmeyen hata'));
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
          <h2 className="text-xl font-bold">{editingCategory ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Kategori Adı</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Malzeme / Hammadde"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Kategori Tipi</label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value as 'income' | 'expense' | 'both')}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="expense">Gider</option>
              <option value="income">Gelir</option>
              <option value="both">Her İkisi</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {editingCategory ? 'Güncelle' : 'Kategoriyi Kaydet'}
          </button>

        </form>
      </div>
    </div>
  );
}

