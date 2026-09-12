'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Expand, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { cn } from '@/lib/utils';

interface ServiceImageCarouselProps {
  readonly images: string[];
  readonly className?: string;
}

export function ServiceImageCarousel({ images, className = '' }: ServiceImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState<Record<number, boolean>>({});

  // No need for useEffect reset if we use a key on the component container in parent or handle it carefully.
  // However, since we are inside the component, we can use a local state that resets when images change by wrapping in a key or just handling logic.
  // A better way is to CLIP the index if it goes out of bounds.
  const displayIndex = currentIndex >= images.length ? 0 : currentIndex;

  if (!images || images.length === 0) {
    return null;
  }

  const goToPrevious = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToIndex = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(index);
  };

  const handleImageLoad = (index: number) => {
    setIsLoaded(prev => ({ ...prev, [index]: true }));
  };

  // Drag constraints and power for swipe
  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  // Single image - show as card with radius
  if (images.length === 1) {
    return (
      <>
        <div className={cn('relative rounded-3xl overflow-hidden aspect-[4/3] cursor-pointer group bg-black/5', className)}>
          {!isLoaded[0] && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-black/10 animate-spin" />
            </div>
          )}
          <Image
            src={images[0]}
            alt="Servicio"
            fill
            className={cn(
              "object-cover transition-all duration-700 group-hover:scale-105",
              isLoaded[0] ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => handleImageLoad(0)}
            sizes="(max-width: 768px) 100vw, 800px"
            priority
          />
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          
          {/* Expand button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="absolute bottom-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:bg-white hover:scale-105"
            aria-label="Ampliar imagen"
            title="Ampliar imagen"
          >
            <Expand size={18} className="text-black/70" />
          </button>
        </div>

        {/* Modal for single image */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm min-h-[100dvh] md:min-h-screen"
              onClick={() => setIsModalOpen(false)}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                aria-label="Cerrar vista completa"
                title="Cerrar vista completa"
              >
                <Expand size={24} className="rotate-180" />
              </button>
              
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full h-[85dvh] max-h-[85dvh]"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={images[0]}
                  alt="Servicio - vista completa"
                  fill
                  className="object-contain rounded-lg"
                  sizes="100vw"
                  priority
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Multiple images - iOS style carousel with swipe
  return (
    <>
      <div className={cn('relative rounded-3xl overflow-hidden aspect-[4/3] bg-black/5', className)}>
        {/* Main image with Swipe support */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);
              if (swipe < -swipeConfidenceThreshold) {
                goToNext();
              } else if (swipe > swipeConfidenceThreshold) {
                goToPrevious();
              }
            }}
            className="absolute inset-0 cursor-pointer group"
            onClick={() => setIsModalOpen(true)}
          >
            {!isLoaded[currentIndex] && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-black/10 animate-spin" />
              </div>
            )}
            <Image
              src={images[currentIndex]}
              alt={`Servicio ${currentIndex + 1}`}
              fill
              className={cn(
                "object-cover transition-all duration-700 group-hover:scale-105",
                isLoaded[currentIndex] ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => handleImageLoad(currentIndex)}
              sizes="(max-width: 768px) 100vw, 800px"
              priority={currentIndex === 0}
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          </motion.div>
        </AnimatePresence>

        {/* Expand button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="absolute bottom-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:bg-white hover:scale-105 z-10"
          aria-label="Ampliar imagen"
        >
          <Expand size={18} className="text-black/70" />
        </button>

        {/* Navigation arrows - iOS style (hidden on mobile if user prefers swipe) */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-105 z-10"
              aria-label="Imagen anterior"
            >
              <ChevronLeft size={20} className="text-black/70" />
            </button>
            <button
              onClick={goToNext}
              className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-105 z-10"
              aria-label="Imagen siguiente"
            >
              <ChevronRight size={20} className="text-black/70" />
            </button>
          </>
        )}

        {/* Pagination dots - iOS style */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full z-10">
            {images.map((url, index) => (
              <button
                key={url}
                onClick={(e) => goToIndex(index, e)}
                className={cn(
                  'transition-all duration-300 rounded-full',
                  index === displayIndex
                    ? 'w-6 h-1.5 bg-white'
                    : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/70'
                )}
                aria-label={`Ir a imagen ${index + 1}`}
                title={`Ir a imagen ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal for carousel */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-lg min-h-[100dvh] md:min-h-screen"
            onClick={() => setIsModalOpen(false)}
          >
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
              aria-label="Cerrar vista completa"
              title="Cerrar vista completa"
            >
              <Expand size={24} className="rotate-180" />
            </button>

            {/* Previous button in modal */}
            {images.length > 1 && (
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-50 hover:scale-110 active:scale-95"
                title="Imagen anterior"
                aria-label="Imagen anterior"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            {/* Current image in modal with Swipe Support */}
            <motion.div
              key={`modal-${currentIndex}`}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.5}
              onDragEnd={(_, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);
                if (swipe < -swipeConfidenceThreshold) {
                  goToNext();
                } else if (swipe > swipeConfidenceThreshold) {
                  goToPrevious();
                }
              }}
              className="relative w-full h-[85dvh] max-h-[85dvh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[currentIndex]}
                alt={`Servicio ${currentIndex + 1}`}
                fill
                className="object-contain rounded-lg"
                sizes="100vw"
                priority
              />
              
              {/* Image counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm">
                {currentIndex + 1} / {images.length}
              </div>
            </motion.div>

            {/* Next button in modal */}
            {images.length > 1 && (
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-50 hover:scale-110 active:scale-95"
                title="Siguiente imagen"
                aria-label="Siguiente imagen"
              >
                <ChevronRight size={28} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
