import { Building2, Zap, TrendingUp, ShieldCheck, Star } from 'lucide-react';

const FEATURES = [
  { icon: Zap, label: 'AI-powered candidate shortlisting' },
  { icon: TrendingUp, label: 'Real-time placement analytics' },
  { icon: ShieldCheck, label: 'SOC 2 Type II certified security' },
];

const METRICS = [
  { value: '10,000+', label: 'Placements' },
  { value: '500+', label: 'Companies' },
  { value: '98%', label: 'Satisfaction' },
];

export function BrandShowcase() {
  return (
    <section className="bg-hero-mesh relative flex flex-col justify-between p-8 lg:p-14 xl:p-16 text-ink-primary overflow-hidden">
      {/* Top Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 shadow-brand-glow">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight">NexHire</span>
      </div>

      {/* Main Value Proposition */}
      <div className="my-12 max-w-lg space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-[2.75rem] sm:leading-[1.15]">
            Smarter Hiring,
            <br />
            Better Outcomes.
          </h1>
          <p className="text-base leading-relaxed text-ink-secondary">
            The recruitment platform built for modern placement offices. Automate drives,
            track candidates, close offers faster.
          </p>
        </div>

        {/* Feature Bullets */}
        <ul className="space-y-3.5">
          {FEATURES.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3.5 text-sm text-ink-secondary">
              <span className="glass-badge flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-brand-400">
                <Icon className="h-4 w-4" />
              </span>
              <span>{label}</span>
            </li>
          ))}
        </ul>

        {/* Key Metrics */}
        <div className="flex flex-wrap items-center gap-10 pt-2">
          {METRICS.map(({ value, label }) => (
            <div key={label}>
              <div className="text-2xl font-bold tracking-tight text-ink-primary">
                {value}
              </div>
              <div className="mt-0.5 text-xs text-ink-secondary/80">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Testimonial Card */}
      <div className="glass-panel max-w-2xl rounded-xl p-5">
        <div className="mb-2.5 flex items-center gap-1 text-accent-star">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Star key={idx} className="h-3.5 w-3.5 fill-current" />
          ))}
        </div>
        <blockquote className="text-sm leading-relaxed text-ink-primary/95">
          “NexHire transformed our placement process. We reduced admin time by 60% and our
          offer rate hit an all-time high.”
        </blockquote>
        <p className="mt-2 text-xs text-ink-secondary/75">
          Dr. Pradeep Kumar, Placement Director, BITS Pilani
        </p>
      </div>
    </section>
  );
}