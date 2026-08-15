// ─── Types
interface SplashScreenProps {
  isFadingOut: boolean;
}

// ─── Render
export function SplashScreen({ isFadingOut }: SplashScreenProps) {
  return (
    <div
      id="splash"
      style={{
        opacity: isFadingOut ? 0 : 1,
        pointerEvents: isFadingOut ? 'none' : 'auto',
      }}
      aria-label="شاشة البداية"
    >
      <div className="logo-wrap">
        <div className="logo-icon" role="img" aria-label="شعار قريتي">
          🏡
        </div>
        <h1>قريتي</h1>
        <p>خدمات القرية الذكية في جيبك</p>
        <div className="dots">
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
        </div>
      </div>
    </div>
  );
}
