export default function LoadingSobreMi() {
  return (
    <div className="py-16 md:py-24 px-6 md:px-10">
      <div className="max-w-4xl mx-auto">
        {/* Header Skeleton */}
        <div className="text-center mb-16 md:mb-24 flex flex-col items-center">
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="h-14 w-80 max-w-full bg-gray-200 rounded-xl animate-pulse mb-8" />
          <div className="h-6 w-full max-w-lg bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Bio Section Skeleton */}
        <div className="max-w-2xl mx-auto mb-20 md:mb-28 space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-11/12 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-10/12 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Values Section Skeleton */}
        <div className="mb-20 md:mb-28">
          <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mx-auto mb-14" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 rounded-2xl bg-gray-100 animate-pulse p-7" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
