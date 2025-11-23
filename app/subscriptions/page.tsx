"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/utils';
import { Plus, Loader2, Trash2, CalendarRange, Pencil } from 'lucide-react';
import { RecurringExpense } from '@/types';
import SubscriptionForm from '@/components/SubscriptionForm';

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);

  // Verileri Çek
  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions((data as any) || []);
    } catch (error) {
      console.error('Veri çekme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Aylık Toplam Hesaplama (Sadece aktif olanlar)
  const monthlyTotal = subscriptions
    .filter(s => s.is_active)
    .reduce((sum, s) => sum + Number(s.amount), 0);

  // Toggle Aktif/Pasif
  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('recurring_expenses')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      await fetchSubscriptions();
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      alert('Durum güncellenirken bir hata oluştu.');
    }
  };

  // Silme
  const handleDelete = async (id: string) => {
    if (!confirm('Bu aboneliği silmek istediğinize emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchSubscriptions();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silinirken bir hata oluştu.');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-muted-foreground gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p>Abonelikler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* BAŞLIK & EKLE BUTONU */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sabit Giderler & Abonelikler</h2>
          <p className="text-muted-foreground">Aylık tekrarlayan giderlerinizi yönetin.</p>
        </div>
        <button 
          onClick={() => {
            setEditingExpense(null);
            setIsFormOpen(true);
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Yeni Abonelik Ekle
        </button>
      </div>

      {/* AYLIK TOPLAM KARTI */}
      <div className="bg-card border p-8 rounded-xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <CalendarRange className="w-32 h-32" />
        </div>
        <div className="relative">
          <p className="text-sm font-medium text-muted-foreground mb-2">Aylık Toplam Sabit Gider</p>
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-bold text-expense">
              {formatCurrency(monthlyTotal)}
            </span>
            <span className="text-sm text-muted-foreground">
              ({subscriptions.filter(s => s.is_active).length} aktif abonelik)
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Bu tutar, aktif tüm aboneliklerinizin aylık toplamıdır.
          </p>
        </div>
      </div>

      {/* ABONELİKLER TABLOSU */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-primary" />
            Tüm Abonelikler
          </h3>
        </div>
        <div className="relative w-full overflow-auto">
          {subscriptions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Henüz abonelik kaydı yok. Yeni bir abonelik ekleyerek başlayın.
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-muted-foreground bg-muted/50 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">İsim</th>
                  <th className="px-6 py-3">Tutar</th>
                  <th className="px-6 py-3">Ödeme Günü</th>
                  <th className="px-6 py-3">Kategori</th>
                  <th className="px-6 py-3">Durum</th>
                  <th className="px-6 py-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{sub.name}</td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-expense">
                        {formatCurrency(sub.amount, sub.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full bg-secondary text-xs border">
                        Ayın {sub.day_of_month}. Günü
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full bg-secondary text-xs border">
                        {sub.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(sub.id, sub.is_active)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          sub.is_active
                            ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {sub.is_active ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingExpense(sub);
                            setIsFormOpen(true);
                          }}
                          className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sub.id)}
                          className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* FORM MODAL */}
      <SubscriptionForm 
        isOpen={isFormOpen} 
        onClose={() => {
          setIsFormOpen(false);
          setEditingExpense(null);
        }} 
        onSuccess={() => {
          fetchSubscriptions();
          setEditingExpense(null);
        }}
        initialData={editingExpense}
      />

    </div>
  );
}

