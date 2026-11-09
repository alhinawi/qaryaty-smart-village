// ─── Imports
import { Sparkles, Zap, Lock, Wallet, MapPin, LifeBuoy } from 'lucide-react';
import { FEATURES } from '@/data/features';

const FEATURE_ICONS = [Zap, Lock, Wallet, MapPin, LifeBuoy];

// ─── Component
export function FeaturesSection() {
  return (
    <section className="bg-green-dark rounded-3xl p-6 text-white mb-6" aria-label="مميزات تطبيق قريتي">
      <h2 className="text-[clamp(1.125rem,2.5vw,1.375rem)] font-black mb-4 flex items-center gap-2">
        <Sparkles size={20} className="shrink-0" aria-hidden="true" />{' '}
        ليه تختار قريتي؟
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {FEATURES.map((feature, index) => (
          <div key={feature.id} className="flex items-start gap-3">
            <div className="w-[38px] h-[38px] bg-white/12 rounded-xl flex items-center justify-center text-[18px] shrink-0" role="img" aria-hidden="true">
              {(() => { const Icon = FEATURE_ICONS[index] ?? Sparkles; return <Icon size={19} className="shrink-0" aria-hidden="true" />; })()}
            </div>
            <div className="feature-text">
              <h3 className="text-sm font-extrabold mb-1">{feature.title}</h3>
              <p className="text-xs opacity-75 leading-[1.4]">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
