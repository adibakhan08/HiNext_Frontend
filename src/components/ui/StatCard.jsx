const COLOR_STYLES = {
  indigo: {
    iconBox: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
    badge: 'bg-emerald-500/12 text-accent-emerald',
    caption: 'text-indigo-400',
  },
  emerald: {
    iconBox: 'bg-emerald-500/15 text-accent-emerald border-emerald-500/20',
    badge: 'bg-emerald-500/12 text-accent-emerald',
    caption: 'text-accent-emerald',
  },
  amber: {
    iconBox: 'bg-amber-500/15 text-accent-amber border-amber-500/20',
    badge: 'bg-emerald-500/12 text-accent-emerald',
    caption: 'text-accent-amber',
  },
  violet: {
    iconBox: 'bg-brand-500/15 text-brand-400 border-brand-500/20',
    badge: 'bg-emerald-500/12 text-accent-emerald',
    caption: 'text-brand-400',
  },
};

export function StatCard({
  icon: Icon,
  badgeText,
  value,
  label,
  caption,
  accent = 'indigo',
}) {
  const styles = COLOR_STYLES[accent] || COLOR_STYLES.indigo;

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-card p-5 transition hover:border-border-subtle/90">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg border ${styles.iconBox}`}
        >
          <Icon className="h-4 w-4" />
        </div>

        {badgeText && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${styles.badge}`}
          >
            {badgeText}
          </span>
        )}
      </div>

      <div className="mt-5">
        <div className="text-2xl font-bold tracking-tight text-ink-primary">
          {value}
        </div>
        <div className="mt-1 text-xs text-ink-secondary">{label}</div>
        {caption && (
          <div className={`mt-1.5 text-[11px] font-medium ${styles.caption}`}>
            {caption}
          </div>
        )}
      </div>
    </div>
  );
}