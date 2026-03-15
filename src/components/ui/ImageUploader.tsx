'use client';

import { useState, useRef } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadImage } from '@/lib/api/storage';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  readonly onUpload: (url: string) => void;
  readonly defaultImage?: string;
  readonly className?: string;
  readonly label?: string;
}

export function ImageUploader({ onUpload, defaultImage, className = '', label = 'Subir Imagen' }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(defaultImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  let borderClass = "border-black/20 bg-gray-50/50 hover:bg-gray-50";
  if (dragActive) {
    borderClass = "border-black bg-black/5";
  } else if (preview) {
    borderClass = "border-transparent bg-black/5";
  }

  const containerClassName = cn(
    "relative w-full h-48 rounded-2xl border-2 border-dashed overflow-hidden flex flex-col items-center justify-center transition-colors",
    borderClass,
    className
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processUpload = async (file: File) => {
    setIsUploading(true);
    // Create local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const result = await uploadImage(formData);
      
      if (result.success && result.url) {
        onUpload(result.url); 
      } else {
        console.error(result.error);
        setPreview(defaultImage || null); // Revert on error
        alert(result.error || 'Error al subir la imagen');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setPreview(defaultImage || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      void processUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files?.[0]) {
      void processUpload(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPreview(null);
    onUpload('');
  };

  return (
    <div className={`w-full ${className}`}>
      {label && <label className="block text-sm font-medium text-black/70 mb-2">{label}</label>}
      
      <label 
        htmlFor="image-upload"
        className={cn(containerClassName, "cursor-pointer block")}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <span className="sr-only">Seleccionar imagen para {label || 'subir'}</span>
        <input 
          id="image-upload"
          ref={inputRef}
          type="file" 
          accept="image/jpeg, image/png, image/webp"
          onChange={handleChange}
          className="hidden"
        />

        <AnimatePresence mode="popLayout">
          {preview ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 w-full h-full group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Vista previa" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  type="button"
                  onClick={handleRemove}
                  className="bg-white/90 text-red-600 p-2 rounded-xl hover:bg-white hover:scale-105 transition-all shadow-lg z-10"
                  title="Eliminar imagen"
                >
                  <X size={20} />
                </button>
              </div>
              {isUploading && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-black/20">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: "100%" }} 
                    transition={{ duration: 1.5, ease: "linear" }}
                    className="h-full bg-black"
                  />
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center text-black/40 pointer-events-none"
            >
              <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-black/5 flex items-center justify-center mb-3">
                <UploadCloud size={20} className="text-black/60" />
              </div>
              <p className="text-sm font-medium text-black/60">Haz clic o arrastrá una imagen</p>
              <p className="text-xs mt-1">PNG, JPG, WEBP hasta 5MB</p>
            </motion.div>
          )}
        </AnimatePresence>
      </label>
    </div>
  );
}
