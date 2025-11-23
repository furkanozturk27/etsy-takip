"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Plus, Trash2, Box, Pencil } from 'lucide-react';
import { BusinessModel } from '@/types';
import ModelForm from '@/components/ModelForm';

export default function ModelsPage() {
  const [models, setModels] = useState<BusinessModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<BusinessModel | null>(null);

  // Verileri Çek
  const fetchModels = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_models')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setModels((data as any) || []);
    } catch (error) {
      console.error('Veri çekme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  // Düzenleme
  const handleEdit = (model: BusinessModel) => {
    setEditingModel(model);
    setIsFormOpen(true);
  };

  // Silme
  const handleDelete = async (id: string) => {
    if (!confirm('Bu iş modelini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;

    try {
      const { error } = await supabase
        .from('business_models')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchModels();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silinirken bir hata oluştu. Bu modele ait işlemler varsa önce onları silmeniz gerekebilir.');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-muted-foreground gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p>İş modelleri yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* BAŞLIK & EKLE BUTONU */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Box className="w-8 h-8 text-primary" />
            İş Modelleri
          </h2>
          <p className="text-muted-foreground mt-2">İş modellerinizi tanımlayın ve yönetin.</p>
        </div>
        <button 
          onClick={() => {
            setEditingModel(null);
            setIsFormOpen(true);
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Yeni İş Modeli Ekle
        </button>
      </div>

      {/* MODELLER LİSTESİ */}
      {models.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Box className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-muted-foreground mb-2">Henüz iş modeli yok</h3>
          <p className="text-muted-foreground">Yeni bir iş modeli ekleyerek başlayın.</p>
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="font-semibold text-lg">Tüm İş Modelleri ({models.length})</h3>
          </div>
          <div className="divide-y divide-border">
            {models.map((model) => (
              <div 
                key={model.id} 
                className="p-6 hover:bg-muted/50 transition-colors flex items-center justify-between group"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">{model.name}</h3>
                  {model.description && (
                    <p className="text-sm text-muted-foreground mb-1">{model.description}</p>
                  )}
                  {model.type && (
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary border">
                      {model.type === 'both' ? 'Gelir & Gider' : model.type === 'income' ? 'Sadece Gelir' : 'Sadece Gider'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(model)}
                    className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                    title="Düzenle"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(model.id)}
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
      <ModelForm 
        isOpen={isFormOpen} 
        onClose={() => {
          setIsFormOpen(false);
          setEditingModel(null);
        }} 
        onSuccess={() => {
          fetchModels();
          setEditingModel(null);
        }}
        editingModel={editingModel}
      />

    </div>
  );
}

