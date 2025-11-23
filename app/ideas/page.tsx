"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Plus, Trash2, Edit, Lightbulb, Pencil } from 'lucide-react';
import { ProductIdea, ProductStatus } from '@/types';
import IdeaForm from '@/components/IdeaForm';

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<ProductIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<ProductIdea | null>(null);

  // Verileri Çek (expectation_score DESC sıralama)
  const fetchIdeas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_ideas')
        .select('*, stores(name)')
        .order('expectation_score', { ascending: false });

      if (error) throw error;
      setIdeas((data as any) || []);
    } catch (error) {
      console.error('Veri çekme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  // Puan Renklendirmesi
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (score >= 5) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  };

  // Statü Badge Renklendirmesi
  const getStatusBadge = (status: ProductStatus) => {
    const statusMap = {
      idea: { label: '💡 Fikir', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      todo: { label: '📋 Yapılacak', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      in_progress: { label: '⚡ Yapılıyor', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
      live: { label: '🚀 Yayında', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      abandoned: { label: '❌ İptal', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    };
    return statusMap[status] || statusMap.idea;
  };

  // Statü Değiştir
  const updateStatus = async (id: string, newStatus: ProductStatus) => {
    try {
      const { error } = await supabase
        .from('product_ideas')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await fetchIdeas();
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      alert('Durum güncellenirken bir hata oluştu.');
    }
  };

  // Silme
  const handleDelete = async (id: string) => {
    if (!confirm('Bu fikri silmek istediğinize emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('product_ideas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchIdeas();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silinirken bir hata oluştu.');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-muted-foreground gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p>Fikirler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* BAŞLIK & EKLE BUTONU */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-primary" />
            Hedefler & Fikirler
          </h2>
          <p className="text-muted-foreground mt-2">En yüksek potansiyelli fikirleriniz en üstte.</p>
        </div>
        <button 
          onClick={() => {
            setEditingIdea(null);
            setIsFormOpen(true);
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Yeni Fikir Ekle
        </button>
      </div>

      {/* FİKİRLER GRİD */}
      {ideas.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Lightbulb className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-muted-foreground mb-2">Henüz fikir yok</h3>
          <p className="text-muted-foreground">Yeni bir fikir ekleyerek başlayın ve potansiyelini değerlendirin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea) => {
            const statusBadge = getStatusBadge(idea.status);
            return (
              <div 
                key={idea.id} 
                className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-lg transition-all relative group overflow-hidden"
              >
                {/* Puan Badge - Sağ Üst */}
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-bold border ${getScoreColor(idea.expectation_score)}`}>
                  {idea.expectation_score}.0
                </div>

                {/* İçerik */}
                <div className="pr-16 mb-4">
                  <h3 className="text-lg font-bold mb-2 line-clamp-2">{idea.title}</h3>
                  {idea.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                      {idea.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>🏪</span>
                    <span>{(idea.store as any)?.name || 'Mağaza'}</span>
                  </div>
                </div>

                {/* Statü Badge */}
                <div className="mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusBadge.color}`}>
                    {statusBadge.label}
                  </span>
                </div>

                {/* İşlem Butonları */}
                <div className="flex items-center gap-2 pt-4 border-t border-border">
                  <select
                    value={idea.status}
                    onChange={(e) => updateStatus(idea.id, e.target.value as ProductStatus)}
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="idea">💡 Fikir</option>
                    <option value="todo">📋 Yapılacak</option>
                    <option value="in_progress">⚡ Yapılıyor</option>
                    <option value="live">🚀 Yayında</option>
                    <option value="abandoned">❌ İptal</option>
                  </select>
                  <button
                    onClick={() => {
                      setEditingIdea(idea);
                      setIsFormOpen(true);
                    }}
                    className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                    title="Düzenle"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(idea.id)}
                    className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Tarih Bilgisi */}
                <div className="mt-3 text-xs text-muted-foreground">
                  {new Date(idea.created_at).toLocaleDateString('tr-TR', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FORM MODAL */}
      <IdeaForm 
        isOpen={isFormOpen} 
        onClose={() => {
          setIsFormOpen(false);
          setEditingIdea(null);
        }} 
        onSuccess={() => {
          fetchIdeas();
          setEditingIdea(null);
        }}
        initialData={editingIdea}
      />

    </div>
  );
}

