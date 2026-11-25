const DEFAULT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export function SectorDonutChart({ title = 'By Sector', items = [] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  const gap = 5;

  let cumulativePercent = 0;

  return (
    <div className="flex flex-col justify-between rounded-xl border border-border-subtle bg-surface-card p-5">
      <h2 className="text-sm font-semibold text-ink-primary">{title}</h2>

      {/* Donut Ring */}
      <div className="my-4 flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="h-52 w-52 -rotate-90">
          {items.map((item, index) => {
            const percent = item.value / total;
            const dashLength = Math.max(percent * circumference - gap, 2);
            const dashOffset = -cumulativePercent * circumference;
            cumulativePercent += percent;

            return (
              <circle
                key={item.label}
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke={item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                strokeWidth="24"
                strokeDasharray={`${dashLength} ${circumference}`}
                strokeDashoffset={dashOffset}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
      </div>

      {/* Bottom Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[10px] text-ink-secondary">
        {items.map((item, index) => {
          const pct = Math.round((item.value / total) * 100);
          return (
            <span key={item.label} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-xs"
                style={{
                  backgroundColor:
                    item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
                }}
              />
              <span>
                {item.label} ({pct}%)
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}