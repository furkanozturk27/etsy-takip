"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Plus, Trash2, Tag, Pencil } from 'lucide-react';
import { Category } from '@/types';
import CategoryForm from '@/components/CategoryForm';
import { formatDate } from '@/lib/utils';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Verileri Çek
  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories((data as any) || []);
    } catch (error) {
      console.error('Veri çekme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Düzenleme
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  // Silme
  const handleDelete = async (id: string) => {
    if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchCategories();
    } catch (error: any) {
      console.error('Silme hatası:', error);
      alert('Silinirken bir hata oluştu: ' + (error?.message || 'Bu kategori kullanılıyor olabilir.'));
    }
  };

  // Tip etiketi
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'income':
        return 'Gelir';
      case 'expense':
        return 'Gider';
      case 'both':
        return 'Her İkisi';
      default:
        return type;
    }
  };

  // Tip rengi
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'expense':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'both':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-secondary text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-muted-foreground gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p>Kategoriler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* BAŞLIK & EKLE BUTONU */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Tag className="w-8 h-8 text-primary" />
            Kategoriler
          </h2>
          <p className="text-muted-foreground mt-2">Gelir ve gider kategorilerinizi yönetin.</p>
        </div>
        <button 
          onClick={() => {
            setEditingCategory(null);
            setIsFormOpen(true);
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Yeni Kategori Ekle
        </button>
      </div>

      {/* KATEGORİLER LİSTESİ */}
      {categories.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Tag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-muted-foreground mb-2">Henüz kategori yok</h3>
          <p className="text-muted-foreground">Yeni bir kategori ekleyerek başlayın.</p>
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="font-semibold text-lg">Kategoriler ({categories.length})</h3>
          </div>
          <div className="divide-y divide-border">
            {categories.map((category) => (
              <div 
                key={category.id} 
                className="p-6 hover:bg-muted/50 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{category.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs border ${getTypeColor(category.type)}`}>
                        {getTypeLabel(category.type)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(category.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* İşlem Butonları */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                    title="Düzenle"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      <CategoryForm 
        isOpen={isFormOpen} 
        onClose={() => {
          setIsFormOpen(false);
          setEditingCategory(null);
        }} 
        onSuccess={() => {
          fetchCategories();
          setEditingCategory(null);
        }}
        editingCategory={editingCategory}
      />

    </div>
  );
}

