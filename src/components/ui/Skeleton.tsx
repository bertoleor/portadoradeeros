import { Card } from './Card';

interface SkeletonProps {
  readonly className?: string;
  readonly variant?: 'text' | 'circular' | 'rectangular';
  readonly glass?: boolean;
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  glass = false,
}: SkeletonProps) {
  const baseClasses = glass ? 'skeleton-glass' : 'skeleton';

  const variantClasses = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-2xl',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} aria-hidden="true" />
  );
}

export function HeroSkeleton() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-8">
      <Skeleton className="h-16 w-80 mb-4" variant="text" />
      <Skeleton className="h-8 w-64 mb-8" variant="text" />
      <Skeleton className="h-12 w-48 rounded-xl" />
    </div>
  );
}

export function ServiceCardSkeleton() {
  return (
    <Card className="p-6 min-w-[300px] glass">
      <Skeleton className="h-16 w-16 rounded-full mb-4" variant="circular" glass />
      <Skeleton className="h-6 w-48 mb-2" variant="text" glass />
      <Skeleton className="h-4 w-full mb-2" variant="text" glass />
      <Skeleton className="h-4 w-3/4 mb-4" variant="text" glass />
      <Skeleton className="h-10 w-32 rounded-xl" glass />
    </Card>
  );
}

export function CarouselSkeleton() {
  return (
    <div className="flex gap-6 overflow-x-auto p-4">
      {['sk-1', 'sk-2', 'sk-3', 'sk-4'].map((id) => (
        <ServiceCardSkeleton key={id} />
      ))}
    </div>
  );
}

export function AboutSkeleton() {
  return (
    <div className="flex flex-col md:flex-row items-center gap-8 p-8 max-w-4xl mx-auto">
      <Skeleton className="w-64 h-64 rounded-full" variant="circular" />
      <div className="flex-1 space-y-4">
        <Skeleton className="h-8 w-48" variant="text" />
        <Skeleton className="h-4 w-full" variant="text" />
        <Skeleton className="h-4 w-full" variant="text" />
        <Skeleton className="h-4 w-3/4" variant="text" />
      </div>
    </div>
  );
}

export function ContactSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass rounded-3xl p-8 md:p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Form section */}
          <div className="space-y-5">
            <Skeleton className="h-8 w-32" variant="text" glass />
            <Skeleton className="h-12 w-full rounded-xl" variant="rectangular" glass />
            <Skeleton className="h-12 w-full rounded-xl" variant="rectangular" glass />
            <Skeleton className="h-12 w-full rounded-xl" variant="rectangular" glass />
            <Skeleton className="h-32 w-full rounded-xl" variant="rectangular" glass />
            <Skeleton className="h-12 w-40 rounded-xl" glass />
          </div>
          {/* Info section */}
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" variant="text" glass />
            <Skeleton className="h-24 w-full rounded-xl" variant="rectangular" glass />
            <Skeleton className="h-16 w-full rounded-xl" variant="rectangular" glass />
            <Skeleton className="h-16 w-full rounded-xl" variant="rectangular" glass />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminTableSkeleton({ rows = 5 }: { readonly rows?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" variant="rectangular" />
        <Skeleton className="h-10 w-32" variant="rectangular" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={`row-skeleton-${i}-${rows}`}
            className="flex gap-4 p-4 rounded-xl border border-black/5 bg-gray-50 flex-1 min-w-[280px]"
          ></div>
        ))}
      </div>
    </div>
  );
}
