"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Plus, Trash2, ShoppingBag, Calendar, Pencil } from 'lucide-react';
import { Store } from '@/types';
import StoreForm from '@/components/StoreForm';
import { formatDate } from '@/lib/utils';

interface StoreWithCount extends Store {
  transaction_count?: number;
}

export default function StoresPage() {
  const [stores, setStores] = useState<StoreWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);

  // Verileri Çek
  const fetchStores = async () => {
    try {
      setLoading(true);
      
      // Stores çek
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });

      if (storesError) throw storesError;

      // Her mağaza için işlem sayısını hesapla
      const storesWithCount = await Promise.all(
        (storesData || []).map(async (store) => {
          const { count, error: countError } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', store.id);

          return {
            ...store,
            transaction_count: countError ? 0 : (count || 0),
          };
        })
      );

      setStores(storesWithCount as any);
    } catch (error) {
      console.error('Veri çekme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // Düzenleme
  const handleEdit = (store: Store) => {
    setEditingStore(store);
    setIsFormOpen(true);
  };

  // Silme
  const handleDelete = async (id: string) => {
    if (!confirm('Bu mağazayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;

    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchStores();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silinirken bir hata oluştu. Bu mağazaya ait işlemler varsa önce onları silmeniz gerekebilir.');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-muted-foreground gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p>Mağazalar yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* BAŞLIK & EKLE BUTONU */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-primary" />
            Mağazalar
          </h2>
          <p className="text-muted-foreground mt-2">Tüm mağazalarınızı yönetin ve takip edin.</p>
        </div>
        <button 
          onClick={() => {
            setEditingStore(null);
            setIsFormOpen(true);
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Yeni Mağaza Ekle
        </button>
      </div>

      {/* MAĞAZALAR GRİD */}
      {stores.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-muted-foreground mb-2">Henüz mağaza yok</h3>
          <p className="text-muted-foreground">Yeni bir mağaza ekleyerek başlayın.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <div 
              key={store.id} 
              className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-lg transition-all relative group"
            >
              {/* İşlem Butonları */}
              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(store)}
                  className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                  title="Düzenle"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(store.id)}
                  className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* İçerik */}
              <div className="pr-8">
                <h3 className="text-xl font-bold mb-2">{store.name}</h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="px-2 py-1 rounded-full bg-secondary text-xs border">
                      {store.platform}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(store.created_at)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Para Birimi: {store.currency}</span>
                  </div>
                </div>

                {/* İstatistik */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Toplam İşlem</span>
                    <span className="text-lg font-bold text-primary">
                      {store.transaction_count || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FORM MODAL */}
      <StoreForm 
        isOpen={isFormOpen} 
        onClose={() => {
          setIsFormOpen(false);
          setEditingStore(null);
        }} 
        onSuccess={() => {
          fetchStores();
          setEditingStore(null);
        }}
        editingStore={editingStore}
      />

    </div>
  );
}

