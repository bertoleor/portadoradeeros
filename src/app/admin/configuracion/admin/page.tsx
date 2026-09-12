'use client';

import { motion } from 'framer-motion';
import { Settings, Save } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button, Input, Label } from '@/components/ui';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useToast } from '@/components/ui/ToastProvider';
import { getAdminSettings, updateAdminSettings } from '@/lib/api/settings';

export default function AdminConfigPage() {
  const [formData, setFormData] = useState({
    nombre: '',
    fotoPerfil: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    async function fetchSettings() {
      const settings = await getAdminSettings();
      if (settings) {
        setFormData({
          nombre: settings.adminName || 'Jacque',
          fotoPerfil: settings.adminAvatarUrl || '',
        });
      }
      setIsLoading(false);
    }
    void fetchSettings();
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const result = await updateAdminSettings({
        adminName: formData.nombre,
        adminAvatarUrl: formData.fotoPerfil,
      });
      setIsSaving(false);
      if (result.ok) {
        success('Configuración interna actualizada correctamente.');
      } else {
        error('Hubo un error al guardar los cambios.');
      }
    } catch (err) {
      setIsSaving(false);
      error((err as Error)?.message || 'Hubo un error al guardar los cambios.');
    }
  };

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
              <Settings size={20} className="text-black/70" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-black">
              Editar Admin (Interno)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-black/50 font-light max-w-md">
            Modifica tu nombre y foto de perfil que se muestra en el panel de administración.
          </p>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-black/20 border-t-black animate-spin" />
          </div>
        ) : (
          <div className="bg-white/60 backdrop-blur-sm border border-white/50 rounded-2xl shadow-sm p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <Label htmlFor="nombre" className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Nombre del Administrador</Label>
                <Input
                  id="nombre"
                  type="text"
                  placeholder="Tu nombre interno"
                  value={formData.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  className="bg-gray-50/50 h-12 text-base"
                />
              </div>

              <div className="space-y-1.5 pt-2">
                <Label className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Foto de Perfil Interna</Label>
                <div className="mt-2">
                  <ImageUploader
                    label="Subir foto de perfil"
                    defaultImage={formData.fotoPerfil}
                    onUpload={(url) => setFormData(prev => ({ ...prev, fotoPerfil: url }))}
                  />
                </div>
              </div>

              <div className="pt-6">
                <Button
                  type="submit"
                  variant="default"
                  disabled={isSaving}
                  className="w-full sm:w-auto btn-primary px-10 py-4 h-auto"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />
                  ) : (
                    <Save size={16} className="mr-2" />
                  )}
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
