import { Sparkles, ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Topbar } from '../layout/Topbar';

export function FeatureComingSoon({
  title,
  subtitle,
  badgeText = 'In Active Development',
  headline,
  description,
  icon: Icon = Sparkles,
  highlights = [],
  eta = 'Upcoming Release',
}) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 flex-col">
      <Topbar title={title} subtitle={subtitle} />

      <main className="flex flex-1 items-center justify-center p-7">
        <div className="w-full max-w-2xl rounded-2xl border border-border-subtle bg-surface-card p-8 shadow-2xl">
          {/* Top Badge & ETA */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/15 px-3 py-1 text-xs font-semibold text-brand-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{badgeText}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-medium text-accent-amber">
              <Clock className="h-3.5 w-3.5" />
              <span>{eta}</span>
            </span>
          </div>

          {/* Icon + Title + Copy */}
          <div className="mt-6 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-brand-500/25 bg-brand-500/15 text-brand-400">
              <Icon className="h-6 w-6" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-ink-primary">{headline}</h2>
              <p className="text-xs leading-relaxed text-ink-secondary">
                {description}
              </p>
            </div>
          </div>

          {/* Planned Capabilities */}
          {highlights.length > 0 && (
            <div className="mt-6 rounded-xl border border-border-subtle bg-surface-input/50 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                What’s Coming in This Module
              </p>
              <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {highlights.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-ink-secondary"
                  >
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-emerald" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Back to Dashboard Action */}
          <div className="mt-6 flex items-center justify-end border-t border-border-subtle pt-5">
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-input px-4 py-2 text-xs font-semibold text-ink-primary transition hover:border-brand-500/40 hover:bg-surface-elevated cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-brand-400" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}