"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { X, Loader2, Save } from 'lucide-react';
import { Store, ProductStatus, ProductIdea } from '@/types';

interface IdeaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: ProductIdea | null;
}

export default function IdeaForm({ isOpen, onClose, onSuccess, initialData }: IdeaFormProps) {
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [storeId, setStoreId] = useState('');
  const [expectationScore, setExpectationScore] = useState('5');
  const [status, setStatus] = useState<ProductStatus>('idea');

  // Dropdown verilerini çek ve form'u initialData ile doldur
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        const { data: storesData } = await supabase.from('stores').select('*');
        if (storesData) setStores(storesData as any);
        
        // Form'u initialData ile doldur
        if (initialData) {
          setTitle(initialData.title);
          setDescription(initialData.description || '');
          setStoreId(initialData.store_id);
          setExpectationScore(initialData.expectation_score.toString());
          setStatus(initialData.status);
        } else {
          // Yeni ekleme modunda formu sıfırla
          setTitle('');
          setDescription('');
          setExpectationScore('5');
          setStatus('idea');
          // İlk mağazayı seç
          if (storesData && storesData.length > 0) setStoreId(storesData[0].id);
        }
      };
      fetchData();
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (initialData) {
        // Update işlemi
        const { error } = await supabase
          .from('product_ideas')
          .update({
            title,
            description: description || null,
            store_id: storeId,
            expectation_score: parseInt(expectationScore),
            status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', initialData.id);

        if (error) throw error;
      } else {
        // Insert işlemi
        const { error } = await supabase.from('product_ideas').insert({
          title,
          description: description || null,
          store_id: storeId,
          expectation_score: parseInt(expectationScore),
          status,
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
          <h2 className="text-xl font-bold">{initialData ? 'Fikri Düzenle' : 'Yeni Fikir Ekle'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Başlık</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Vintage Minder Koleksiyonu"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Açıklama</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Fikrin detaylarını buraya yazın..."
              rows={4}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Mağaza</label>
              <select 
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
              >
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Beklenti Puanı</label>
              <select 
                value={expectationScore}
                onChange={(e) => setExpectationScore(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="1">1 - Düşük Potansiyel</option>
                <option value="2">2 - Düşük Potansiyel</option>
                <option value="3">3 - Düşük Potansiyel</option>
                <option value="4">4 - Düşük Potansiyel</option>
                <option value="5">5 - Orta Potansiyel</option>
                <option value="6">6 - Orta Potansiyel</option>
                <option value="7">7 - Orta Potansiyel</option>
                <option value="8">8 - Yüksek Potansiyel</option>
                <option value="9">9 - Yüksek Potansiyel</option>
                <option value="10">10 - Çok Yüksek Potansiyel</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Durum</label>
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductStatus)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="idea">💡 Fikir</option>
              <option value="todo">📋 Yapılacak</option>
              <option value="in_progress">⚡ Yapılıyor</option>
              <option value="live">🚀 Yayında</option>
              <option value="abandoned">❌ İptal Edildi</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {initialData ? 'Güncelle' : 'Fikri Kaydet'}
          </button>

        </form>
      </div>
    </div>
  );
}
