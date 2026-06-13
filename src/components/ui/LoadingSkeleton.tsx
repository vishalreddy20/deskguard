export function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-slate-200 rounded-xl ${className}`}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-64" />
        <SkeletonBlock className="h-4 w-40" />
      </div>
      {/* Tabs */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonBlock key={i} className="h-9 w-24" />
        ))}
      </div>
      {/* Desk grid */}
      <div className="grid grid-cols-8 gap-3">
        {Array.from({ length: 24 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-14 w-14" />
        ))}
      </div>
    </div>
  );
}

export function BookingsSkeleton() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <SkeletonBlock className="h-8 w-48" />
      <div className="bg-white rounded-2xl p-6 space-y-4 shadow-sm border border-slate-100">
        <div className="flex justify-between">
          <SkeletonBlock className="h-7 w-32" />
          <SkeletonBlock className="h-6 w-24 rounded-full" />
        </div>
        <SkeletonBlock className="h-4 w-56" />
        <SkeletonBlock className="h-28 w-full" />
        <SkeletonBlock className="h-11 w-full" />
        <SkeletonBlock className="h-11 w-full" />
      </div>
    </div>
  );
}

export function LibrarianSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <SkeletonBlock className="h-8 w-52" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonBlock key={i} className="h-28" />
        ))}
      </div>
      <SkeletonBlock className="h-64 w-full" />
    </div>
  );
}
