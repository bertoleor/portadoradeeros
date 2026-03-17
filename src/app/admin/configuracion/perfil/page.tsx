'use client';

import { useState, useEffect } from 'react';
import { Save, User, Link as LinkIcon } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { useToast } from '@/components/ui/ToastProvider';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { getAdminSettings, updateAdminSettings } from '@/lib/api/settings';

export default function PerfilConfiguracion() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error } = useToast();

  const [config, setConfig] = useState({
    profileImage: '',
    siteUrl: '',
    instagram: '',
    whatsapp: '',
    tiktok: '',
    email: '',
    sobreMi: '',
  });

  useEffect(() => {
    async function fetchSettings() {
      const settings = await getAdminSettings();
      if (settings) {
        setConfig({
          profileImage: settings.profileImageUrl || '',
          siteUrl: settings.siteUrl || '',
          instagram: settings.socialLinks.instagram || '',
          whatsapp: settings.socialLinks.whatsapp || '',
          tiktok: settings.socialLinks.tiktok || '',
          email: settings.contactEmail || '',
          sobreMi: settings.bioContent || '',
        });
      }
      setIsLoading(false);
    }
    void fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    
    const result = await updateAdminSettings({
      siteUrl: config.siteUrl,
      instagramUrl: config.instagram,
      whatsappUrl: config.whatsapp,
      tiktokUrl: config.tiktok,
      contactEmail: config.email,
      bioContent: config.sobreMi,
      profileImageUrl: config.profileImage,
    });
    
    setIsSaving(false);
    if (result.success) {
      success('Perfil y redes actualizados correctamente.');
    } else {
      error('Hubo un error al guardar. Inténtalo de nuevo.');
    }
  };

  const updateField = (field: keyof typeof config, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-medium text-black">Perfil y Redes</h2>
          <p className="text-black/50 text-sm mt-1">
            Información de contacto y biografía principal del sitio.
          </p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="w-full sm:w-auto btn-primary inline-flex items-center justify-center gap-2 px-6 py-2.5"
        >
          {isSaving ? (
            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <><Save size={16} /> Guardar</>
          )}
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-black/20 border-t-black animate-spin" />
        </div>
      ) : (
      <form className="space-y-8">
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-black/40 uppercase tracking-widest flex items-center gap-2 border-b border-black/5 pb-2">
            <LinkIcon size={14} /> Redes Sociales y Contacto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label htmlFor="siteUrl" className="block text-[10px] font-bold text-black/40 mb-2 uppercase tracking-widest">URL del Sitio</label>
              <Input 
                id="siteUrl"
                type="url"
                value={config.siteUrl}
                onChange={(e) => updateField('siteUrl', e.target.value)}
                className="bg-gray-50/50 h-10 text-sm"
                placeholder="https://tusitio.com"
              />
            </div>
            <div>
              <label htmlFor="instagram" className="block text-[10px] font-bold text-black/40 mb-2 uppercase tracking-widest">Instagram (URL)</label>
              <Input 
                id="instagram"
                type="url"
                value={config.instagram}
                onChange={(e) => updateField('instagram', e.target.value)}
                className="bg-gray-50/50 h-10 text-sm"
                placeholder="https://instagram.com/..."
              />
            </div>
            <div>
              <label htmlFor="whatsapp" className="block text-[10px] font-bold text-black/40 mb-2 uppercase tracking-widest">WhatsApp (Link)</label>
              <Input 
                id="whatsapp"
                type="url"
                value={config.whatsapp}
                onChange={(e) => updateField('whatsapp', e.target.value)}
                className="bg-gray-50/50 h-10 text-sm"
                placeholder="https://wa.me/..."
              />
            </div>
            <div>
              <label htmlFor="tiktok" className="block text-[10px] font-bold text-black/40 mb-2 uppercase tracking-widest">TikTok (URL)</label>
              <Input 
                id="tiktok"
                type="url"
                value={config.tiktok}
                onChange={(e) => updateField('tiktok', e.target.value)}
                className="bg-gray-50/50 h-10 text-sm"
                placeholder="https://tiktok.com/..."
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="email" className="block text-[10px] font-bold text-black/40 mb-2 uppercase tracking-widest">Correo Electrónico</label>
              <Input 
                id="email"
                type="email"
                value={config.email}
                onChange={(e) => updateField('email', e.target.value)}
                required
                className="bg-gray-50/50 h-10 text-sm"
                placeholder="tu@email.com"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6 pt-4">
          <h3 className="text-sm font-semibold text-black/40 uppercase tracking-widest flex items-center gap-2 border-b border-black/5 pb-2">
            <User size={14} /> Sobre Mí (Biografía)
          </h3>
          <p className="text-xs sm:text-sm text-black/40 mb-4 font-light leading-relaxed">
            Editá la foto principal y los párrafos de tu página &quot;Sobre Mí&quot;. Podés agregar más imágenes dentro del texto.
          </p>

          <div className="mb-6">
            <ImageUploader 
              label="Foto Principal / Portada"
              defaultImage={config.profileImage}
              onUpload={(url) => updateField('profileImage', url)}
            />
          </div>

          <RichTextEditor 
            content={config.sobreMi}
            onChange={(content) => updateField('sobreMi', content)}
          />
        </div>
      </form>
      )}
    </div>
  );
}
