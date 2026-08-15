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
      className="toast show"
    >
      {message}
    </div>
  );
}
