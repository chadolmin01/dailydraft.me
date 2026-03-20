export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6 animate-pulse">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <div className="h-5 w-48 bg-surface-sunken border border-border" />
        <div className="h-3 w-72 bg-surface-sunken border border-border" />
      </div>

      {/* Content grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-card border border-border-strong p-4 space-y-3"
          >
            <div className="h-4 w-2/3 bg-surface-sunken border border-border" />
            <div className="h-3 w-full bg-surface-sunken border border-border" />
            <div className="h-3 w-4/5 bg-surface-sunken border border-border" />
            <div className="flex gap-2 pt-1">
              <div className="h-5 w-16 bg-surface-sunken border border-border" />
              <div className="h-5 w-12 bg-surface-sunken border border-border" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
