// ─── Imports
import { FEATURES } from '@/data/features';

// ─── Component
export function FeaturesSection() {
  return (
    <section className="features" aria-label="مميزات تطبيق قريتي">
      <h3>
        <span role="img" aria-hidden="true">
          ✨
        </span>{' '}
        ليه تختار قريتي؟
      </h3>

      <div className="features-grid">
        {FEATURES.map((feature) => (
          <div key={feature.id} className="feature-item">
            <div className="feature-icon" role="img" aria-hidden="true">
              {feature.icon}
            </div>
            <div className="feature-text">
              <h5>{feature.title}</h5>
              <p>{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
