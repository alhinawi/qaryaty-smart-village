// ─── Types
interface ToastProps {
  message: string | null;
}

// ─── Render
export function Toast({ message }: ToastProps) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-[80px] left-1/2 -translate-x-1/2 bg-green-dark text-white px-6 py-3 rounded-[14px] text-sm font-bold shadow-[0_8px_24px_rgba(0,0,0,0.3)] z-[400] transition-all duration-300 [transition-timing-function:cubic-bezier(0.34,1.2,0.64,1)] opacity-100 pointer-events-none whitespace-nowrap [direction:rtl] border border-white/20"
    >
      {message}
    </div>
  );
}
