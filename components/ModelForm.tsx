"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { X, Loader2, Save } from 'lucide-react';
import { BusinessModel } from '@/types';

interface ModelFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingModel?: BusinessModel | null;
}

export default function ModelForm({ isOpen, onClose, onSuccess, editingModel }: ModelFormProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'both' | 'income' | 'expense'>('both');

  // Form'u düzenleme modunda doldur
  useEffect(() => {
    if (isOpen && editingModel) {
      setName(editingModel.name);
      setDescription(editingModel.description || '');
      setType(editingModel.type || 'both');
    } else if (isOpen && !editingModel) {
      // Yeni ekleme modunda formu sıfırla
      setName('');
      setDescription('');
      setType('both');
    }
  }, [isOpen, editingModel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingModel) {
        // Update işlemi
        const { error } = await supabase
          .from('business_models')
          .update({
            name,
            description: description || null,
            type,
          })
          .eq('id', editingModel.id);

        if (error) throw error;
      } else {
        // Insert işlemi
        const { error } = await supabase.from('business_models').insert({
          name,
          description: description || null,
          type,
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
          <h2 className="text-xl font-bold">{editingModel ? 'Modeli Düzenle' : 'Yeni İş Modeli Ekle'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Model Adı</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: POD, Physical Inventory, Digital"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Tür (Type)</label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value as 'both' | 'income' | 'expense')}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="both">Gelir & Gider (Genel)</option>
              <option value="income">Sadece Gelir</option>
              <option value="expense">Sadece Gider</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Açıklama (Opsiyonel)</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="İş modelinin detaylarını açıklayın..."
              rows={3}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {editingModel ? 'Güncelle' : 'Modeli Kaydet'}
          </button>

        </form>
      </div>
    </div>
  );
}
