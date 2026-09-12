'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Save, Sparkles, Trash2, Image as ImageIcon, ChevronUp, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, use } from 'react';

import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { Input } from '@/components/ui/Input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { ServiceIcon, SERVICES_ICONS_GALLERY } from '@/components/ui/ServiceIcons';
import { Textarea } from '@/components/ui/TextArea';
import { useToast } from '@/components/ui/ToastProvider';
import { getServiceBySlug, updateService, createService, deleteService } from '@/lib/api/services';

import type { Service } from '@/types';
import type { ChangeEvent } from 'react';

interface AdminEditServicioProps {
  readonly params: Promise<{ slug: string }>;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '') // eliminar acentos
    .replaceAll(/[^a-z0-9\s-]/g, '')    // solo alfanuméricos, espacios y guiones
    .trim()
    .replaceAll(/\s+/g, '-')            // espacios → guiones
    .replaceAll(/-+/g, '-');            // múltiples guiones → uno
}

export default function AdminEditServicio({ params }: AdminEditServicioProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  
  const [service, setService] = useState<Service | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const { success } = useToast();

  useEffect(() => {
    const loadService = async () => {
      if (resolvedParams.slug === 'nuevo') {
        setIsNew(true);
        setService({
          id: '',
          slug: '',
          title: '',
          shortDescription: '',
          description: '',
          price: 0,
          duration: 60,
          isVisible: false,
          icon: 'sparkles',
          images: [],
        });
        setIsLoading(false);
        return;
      }
      
      const foundService = await getServiceBySlug(resolvedParams.slug);
      if (foundService) {
        setService({ ...foundService });
      } else {
        router.push('/admin/servicios');
      }
      setIsLoading(false);
    };
    void loadService();
  }, [resolvedParams.slug, router]);

  if (isLoading || !service) {
    return <div className="p-10 flex justify-center"><div className="w-8 h-8 rounded-full border-2 border-black border-t-transparent animate-spin"/></div>;
  }

  const saveService = async () => {
    setIsSaving(true);

    try {
      if (isNew) {
        await createService({
          slug: service.slug,
          title: service.title,
          shortDescription: service.shortDescription,
          description: service.description,
          price: service.price,
          duration: service.duration,
          isVisible: service.isVisible,
          icon: service.icon,
          images: service.images,
        });
        success('Servicio creado exitosamente.');
      } else {
        await updateService(service.id, service);
        success('Servicio guardado exitosamente.');
      }
    } catch (err) {
      console.error('Error saving service:', err);
      success('Error al guardar servicio.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormSubmit = (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    void saveService();
  };

  const handleDelete = async () => {
    if (!service.id) return;
    try {
      await deleteService(service.id);
      success('Servicio eliminado.');
      router.push('/admin/servicios');
    } catch (err) {
      console.error('Error deleting service:', err);
      success('Error al eliminar servicio.');
    }
  };

  const updateField = <K extends keyof Service>(field: K, value: Service[K]) => {
    setService(prev => prev ? { ...prev, [field]: value } : null);
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full">
      <ConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="¿Eliminar definitivamente?"
        description={`Estás por eliminar el servicio "${service.title}". Esta acción es irreversible.`}
        confirmText="Sí, eliminar"
      />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link 
          href="/admin/servicios"
          className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black mb-8 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Volver a Servicios
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-black mb-1">
              {isNew ? 'Nuevo Servicio' : `Editar: ${service.title}`}
            </h1>
            <p className="text-black/50 font-light text-sm">
              Actualizá la información, precio y descripción del servicio.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!isNew && (
              <button
                onClick={() => setDeleteModalOpen(true)}
                type="button"
                className="inline-flex items-center justify-center p-2.5 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Eliminar este servicio"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button 
              onClick={() => void saveService()}
              disabled={isSaving}
              className="btn-primary inline-flex items-center gap-2 px-6 py-2.5"
            >
              {isSaving ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <><Save size={16} /> Guardar Cambios</>
              )}
            </button>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-8 pb-20">
          
          <div className="bg-white border border-black/5 rounded-2xl shadow-sm p-6 md:p-8">
            <h2 className="text-lg font-medium text-black mb-6 flex items-center gap-2">
              <Sparkles size={18} className="text-black/40" />
              Información Principal
            </h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="svc-title" className="block text-sm font-medium text-black/70 mb-2">Título del servicio</label>
                  <Input 
                    id="svc-title"
                    value={service.title}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setService(prev => {
                        if (!prev) return null;
                        // Auto-sync slug solo si:
                        // 1. Es un servicio nuevo
                        // 2. El slug actual coincide con el slugificado del titulo previo (no fue editado manualmente)
                        const currentTitleSlug = slugify(prev.title);
                        const shouldSyncSlug = isNew || prev.slug === currentTitleSlug || !prev.slug;
                        
                        return { 
                          ...prev, 
                          title: newTitle, 
                          slug: shouldSyncSlug ? slugify(newTitle) : prev.slug 
                        };
                      });
                    }}
                    required
                    className="bg-white border-black/20"
                  />
                </div>
                <div>
                  <label htmlFor="svc-slug" className="block text-sm font-medium text-black/70 mb-2">Slug (URL)</label>
                  <div className="relative">
                    <Input 
                      id="svc-slug"
                      value={service.slug}
                      onChange={(e) => updateField('slug', e.target.value)}
                      required
                      className="bg-white border-black/20 pr-16"
                    />
                    <button
                      type="button"
                      onClick={() => setService(prev => prev ? { ...prev, slug: slugify(prev.title) } : null)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 mt-px text-[10px] text-black/40 hover:text-black/70 transition-colors underline underline-offset-2"
                    >
                      Regenerar
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <fieldset className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                  <legend className="sr-only">Seleccionar icono</legend>
                  {Object.entries(SERVICES_ICONS_GALLERY).map(([key, info]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => updateField('icon', key)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                        service.icon === key 
                          ? 'bg-white/55 backdrop-blur-md border border-white/60 text-[rgba(15,15,20,0.85)] shadow-sm' 
                          : 'border-[rgba(15,15,20,0.08)] bg-white/20 text-[rgba(15,15,20,0.40)] hover:border-[rgba(15,15,20,0.20)] hover:bg-white/35'
                      }`}
                      title={info.label}
                      aria-label={info.label}
                    >
                      <ServiceIcon type={key} size={20} />
                    </button>
                  ))}
                </fieldset>
              </div>

              <div>
                <label htmlFor="svc-short-desc" className="block text-sm font-medium text-black/70 mb-2">Descripción corta (Tarjeta)</label>
                <Textarea 
                  id="svc-short-desc"
                  value={service.shortDescription}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => updateField('shortDescription', e.target.value)}
                  required
                  rows={2}
                  className="bg-white border-black/20 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                <div>
                  <label htmlFor="svc-price" className="block text-sm font-medium text-black/70 mb-2">Precio ($ ARS)</label>
                  <Input 
                    id="svc-price"
                    type="number"
                    value={service.price}
                    onChange={(e) => updateField('price', Number.parseInt(e.target.value))}
                    required
                    className="bg-white border-black/20"
                  />
                </div>
                <div>
                  <label htmlFor="svc-duration" className="block text-sm font-medium text-black/70 mb-2">Duración (minutos)</label>
                  <Input 
                    id="svc-duration"
                    type="number"
                    value={service.duration}
                    onChange={(e) => updateField('duration', Number.parseInt(e.target.value))}
                    required
                    className="bg-white border-black/20"
                  />
                </div>
                <div className="flex flex-col justify-end pb-2">
                  <label htmlFor="svc-visible" className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input 
                        id="svc-visible"
                        type="checkbox" 
                        checked={service.isVisible}
                        onChange={(e) => updateField('isVisible', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[rgba(15,15,20,0.08)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[rgba(15,15,20,0.15)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgba(15,15,20,0.55)]"></div>
                    </div>
                    <span className="text-sm font-medium text-black/70 group-hover:text-black">
                      Visible (Público)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-black/5 rounded-2xl shadow-sm p-6 md:p-8">
            <h2 className="text-lg font-medium text-black mb-2">
              Descripción Detallada
            </h2>
            <p className="text-sm text-black/40 mb-6 font-light">
              Este contenido aparecerá en la página principal del servicio. Podés usar formato, listas y destacados.
            </p>
            
            <RichTextEditor 
              content={service.description}
              onChange={(content) => updateField('description', content)}
            />
          </div>

          <div className="bg-white border border-black/5 rounded-2xl shadow-sm p-6 md:p-8">
            <h2 className="text-lg font-medium text-black mb-2 flex items-center gap-2">
              <ImageIcon size={18} className="text-black/40" />
              Imágenes del Servicio
            </h2>
            <p className="text-sm text-black/40 mb-6 font-light">
              Agregá una o varias imágenes. La primera será la portada del servicio.
            </p>
            
            {/* Existing images */}
            {service.images && service.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                {service.images.map((url, index) => (
                  <div key={url} className="relative aspect-square rounded-xl overflow-hidden group border border-black/10 bg-black/5">
                    <Image 
                      src={url} 
                      alt={`Imagen ${index + 1}`} 
                      fill 
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 200px"
                    />
                    
                    {/* Badge for cover image */}
                    {index === 0 && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black text-white text-[10px] uppercase tracking-wider rounded-md font-bold z-10">
                        Portada
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-20">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => {
                            const newImages = [...service.images];
                            [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
                            updateField('images', newImages);
                          }}
                          className="bg-white/90 text-black p-1.5 rounded-lg hover:bg-white disabled:opacity-30 transition-all"
                          aria-label="Subir posición"
                          title="Subir posición"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          type="button"
                          disabled={index === service.images.length - 1}
                          onClick={() => {
                            const newImages = [...service.images];
                            [newImages[index + 1], newImages[index]] = [newImages[index], newImages[index + 1]];
                            updateField('images', newImages);
                          }}
                          className="bg-white/90 text-black p-1.5 rounded-lg hover:bg-white disabled:opacity-30 transition-all"
                          aria-label="Bajar posición"
                          title="Bajar posición"
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const newImages = [...service.images];
                          newImages.splice(index, 1);
                          updateField('images', newImages);
                        }}
                        className="bg-white/90 text-red-600 p-2 rounded-xl hover:bg-white hover:scale-105 transition-all mt-1"
                        aria-label={`Eliminar imagen ${index + 1}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add new image */}
            <div className="max-w-sm">
              <ImageUploader
                label="Agregar imagen"
                onUpload={(url) => {
                  if (url) {
                    const currentImages = service.images || [];
                    updateField('images', [...currentImages, url]);
                  }
                }}
              />
            </div>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
