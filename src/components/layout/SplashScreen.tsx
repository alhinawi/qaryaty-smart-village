// ─── Types
interface SplashScreenProps {
  isFadingOut: boolean;
}

// ─── Render
export function SplashScreen({ isFadingOut }: SplashScreenProps) {
  return (
    <div
      id="splash"
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center min-h-svh bg-linear-to-br from-green-dark via-green to-green-light transition-opacity duration-800 ease-in-out"
      style={{
        opacity: isFadingOut ? 0 : 1,
        pointerEvents: isFadingOut ? 'none' : 'auto',
      }}
      aria-label="شاشة البداية"
    >
      <div className="text-center animate-[splashPop_0.7s_cubic-bezier(0.34,1.56,0.64,1)_both]">
        <div className="w-[100px] h-[100px] bg-gold rounded-3xl flex items-center justify-center text-[54px] mx-auto mb-5 shadow-[0_20px_60px_rgba(240,165,0,0.5)]" role="img" aria-label="شعار قريتي">
          🏡
        </div>
        <h1 className="font-['Tajawal',sans-serif] text-[clamp(2.5rem,6vw,3.5rem)] font-black text-white [text-shadow:0_4px_20px_rgba(0,0,0,0.3)] leading-[1.1]">قريتي</h1>
        <p className="text-white/85 text-[clamp(1rem,3vw,1.25rem)] mt-2 animate-[fadeUp_0.6s_0.4s_both]">خدمات القرية الذكية في جيبك</p>
        <div className="mt-10 flex justify-center gap-2.5 animate-[fadeUp_0.6s_0.6s_both]">
          <div className="w-[10px] h-[10px] rounded-full bg-white/40 animate-[bounce_1.2s_infinite]" />
          <div className="w-[10px] h-[10px] rounded-full bg-white/40 animate-[bounce_1.2s_infinite] [animation-delay:0.2s]" />
          <div className="w-[10px] h-[10px] rounded-full bg-white/40 animate-[bounce_1.2s_infinite] [animation-delay:0.4s]" />
        </div>
      </div>
    </div>
  );
}
