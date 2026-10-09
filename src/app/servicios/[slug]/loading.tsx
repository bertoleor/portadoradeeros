export default function LoadingServicioDetalle() {
  return (
    <article className="py-16 md:py-24 px-6 md:px-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 md:mb-16">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex-1">
              <div className="h-12 md:h-16 w-3/4 max-w-lg bg-gray-200 rounded-xl animate-pulse mb-4" />
              <div className="h-5 w-full max-w-md bg-gray-200 rounded animate-pulse" />
            </div>

            <div className="flex flex-col gap-4 min-w-[200px] shrink-0">
              <div className="h-20 w-full bg-gray-100 rounded-2xl animate-pulse" />
              <div className="h-12 w-full bg-gray-200 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-black/5 my-12" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">
          <div className="md:col-span-8 space-y-6">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-8" />

            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-11/12 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-10/12 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>

          <div className="md:col-span-4 space-y-8">
            <div className="h-48 w-full bg-gray-50 rounded-2xl animate-pulse" />
            <div className="h-32 w-full bg-gray-50 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </article>
  );
}
