// ─── Skeleton Loading Components

export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton-img skeleton-pulse" />
      <div className="skeleton-body">
        <div className="skeleton-line skeleton-title skeleton-pulse" />
        <div className="skeleton-line skeleton-desc skeleton-pulse" />
        <div className="skeleton-line skeleton-desc-short skeleton-pulse" />
        <div className="skeleton-footer">
          <div className="skeleton-tag skeleton-pulse" />
          <div className="skeleton-tag skeleton-pulse" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="services-grid" aria-label="جاري التحميل...">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}
