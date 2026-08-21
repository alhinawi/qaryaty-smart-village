// ─── Skeleton Loading Components

export function SkeletonCard() {
  const pulseClass =
    "bg-[linear-gradient(90deg,#f0f0f0_25%,#e0e0e0_50%,#f0f0f0_75%)] bg-size-[200%_100%] animate-[skeletonShimmer_1.5s_infinite]";
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden p-0 border border-black/5"
      aria-hidden="true"
    >
      <div className={`h-[110px] w-full ${pulseClass}`} />
      <div className="p-3.5">
        <div className={`h-[16px] rounded-xl mb-2 w-[70%] ${pulseClass}`} />
        <div className={`h-[14px] rounded-xl mb-2 w-[90%] ${pulseClass}`} />
        <div className={`h-[14px] rounded-xl mb-2 w-1/2 ${pulseClass}`} />
        <div className="flex justify-between mt-3">
          <div className={`w-[40%] h-[18px] rounded-xl ${pulseClass}`} />
          <div className={`w-[40%] h-[18px] rounded-xl ${pulseClass}`} />
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
