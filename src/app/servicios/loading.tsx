import { ServiceCardSkeleton } from '@/components/ui/Skeleton';

export default function LoadingServicios() {
  return (
    <section className="py-16 md:py-24 px-4 md:px-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-14 md:mb-20">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mx-auto mb-4" />
          <div className="h-14 w-64 bg-gray-200 rounded-xl animate-pulse mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {['a', 'b', 'c', 'd'].map((id) => (
            <ServiceCardSkeleton key={`skeleton-service-${id}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
