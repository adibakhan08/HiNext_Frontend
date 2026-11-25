import { useEffect, useState } from 'react';
import {
  Users,
  CheckCircle2,
  Building2,
  TrendingUp,
  IndianRupee,
  GraduationCap,
  Layers,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { axiosClient } from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import { Topbar } from '../../../components/layout/Topbar';
import { StatCard } from '../../../components/ui/StatCard';
import {
  DEFAULT_ANALYTICS_FILTERS,
  useAnalyticsData,
} from '../analytics/hooks/useAnalyticsData';

function formatLpa(val) {
  const num = Number(val);
  if (!num || Number.isNaN(num)) return '0.0 LPA';
  return `${num.toFixed(1)} LPA`;
}

export function AdminDashboard() {
  const [filters, setFilters] = useState({
    academic_session: '',
    department: '',
    company: '',
    year: '2026',
  });

  const [departments, setDepartments] = useState([]);
  const [companies, setCompanies] = useState([]);

  const {
    overview,
    placementTrends,
    departmentWise,
    companyWise,
    packageAnalysis,
    isLoading,
    failedEndpointsCount,
  } = useAnalyticsData(filters, { includeExtended: false });

  useEffect(() => {
    Promise.allSettled([
      axiosClient.get(API_ENDPOINTS.ACADEMICS.DEPARTMENTS),
      axiosClient.get(API_ENDPOINTS.ADMIN.COMPANIES),
    ]).then(([deptRes, compRes]) => {
      if (deptRes.status === 'fulfilled') {
        const d = deptRes.value.data;
        setDepartments(Array.isArray(d) ? d : d?.results || []);
      }
      if (compRes.status === 'fulfilled') {
        const c = compRes.value.data;
        setCompanies(Array.isArray(c) ? c : c?.results || []);
      }
    });
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      academic_session: '',
      department: '',
      company: '',
      year: '',
    });
  };

  const maxTrendValue = Math.max(
    1,
    ...placementTrends.map((t) => Number(t.total_placements) || 0)
  );

  const maxPackageRangeCount = Math.max(
    1,
    ...packageAnalysis.package_distribution.map((b) => Number(b.count) || 0)
  );

  const avgCtc = packageAnalysis.average_package || overview.average_package;
  const highCtc = packageAnalysis.highest_package || overview.highest_package;
  const lowCtc = packageAnalysis.lowest_package || overview.lowest_package;

  return (
    <div className="flex flex-1 flex-col">
      <Topbar
        title="Placement Dashboard"
        subtitle="Overview of placements, monthly trends, CTC packages, departments, and recruiters"
      />

      <main className="flex-1 space-y-6 p-7">
        {/* Filters */}
        <section className="rounded-xl border border-border-subtle bg-surface-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink-secondary">
              <Filter className="h-3.5 w-3.5 text-brand-400" />
              <span>Dashboard Filters</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="number"
                name="academic_session"
                min="1"
                value={filters.academic_session}
                onChange={handleFilterChange}
                placeholder="Session ID (e.g. 1)"
                className="w-36 rounded-lg border border-border-subtle bg-surface-input px-3 py-1.5 text-xs text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none"
              />

              <input
                type="number"
                name="year"
                min="2000"
                max="2100"
                value={filters.year}
                onChange={handleFilterChange}
                placeholder="Year (2026)"
                className="w-28 rounded-lg border border-border-subtle bg-surface-input px-3 py-1.5 text-xs text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none"
              />

              <select
                name="department"
                value={filters.department}
                onChange={handleFilterChange}
                className="rounded-lg border border-border-subtle bg-surface-input px-3 py-1.5 text-xs text-ink-primary focus:border-border-focus focus:outline-none"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id} className="bg-surface-card">
                    {dept.name}
                  </option>
                ))}
              </select>

              <select
                name="company"
                value={filters.company}
                onChange={handleFilterChange}
                className="rounded-lg border border-border-subtle bg-surface-input px-3 py-1.5 text-xs text-ink-primary focus:border-border-focus focus:outline-none"
              >
                <option value="">All Companies</option>
                {companies.map((comp) => (
                  <option key={comp.id} value={comp.id} className="bg-surface-card">
                    {comp.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-input px-3 py-1.5 text-xs font-medium text-ink-secondary transition hover:bg-surface-elevated hover:text-ink-primary cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </section>

        {failedEndpointsCount > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/25 px-4 py-3 text-xs text-amber-200">
            {failedEndpointsCount} of 5 dashboard analytics APIs returned an error or empty response.
          </div>
        )}

        {/* Overview KPIs (/api/analytics/overview/) */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Users}
            value={isLoading ? '—' : overview.total_candidates}
            label="Total Candidates"
            caption={`${overview.total_unplaced} unplaced · ${overview.total_applications} applications`}
            accent="indigo"
          />
          <StatCard
            icon={CheckCircle2}
            value={isLoading ? '—' : overview.total_placed}
            label="Total Placed"
            caption={`${Number(overview.placement_rate || 0).toFixed(1)}% placement rate`}
            accent="emerald"
          />
          <StatCard
            icon={Building2}
            value={isLoading ? '—' : overview.total_companies}
            label="Partner Companies"
            caption={`${overview.active_companies} active · ${overview.total_drives} drives`}
            accent="violet"
          />
          <StatCard
            icon={IndianRupee}
            value={isLoading ? '—' : formatLpa(avgCtc)}
            label="Average Package"
            caption={`Highest ${formatLpa(highCtc)} · Lowest ${formatLpa(lowCtc)}`}
            accent="amber"
          />
        </div>

        {/* Placement Trends + Package Analysis */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <section className="rounded-xl border border-border-subtle bg-surface-card p-6 xl:col-span-7">
            <div className="flex items-center gap-2.5 border-b border-border-subtle pb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-ink-primary">
                  Monthly Placement Trends
                </h2>
                <p className="text-[11px] text-ink-muted">
                  From /api/analytics/placement-trends/
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="py-14 text-center text-xs text-ink-muted">
                Loading placement trends...
              </div>
            ) : placementTrends.length === 0 ? (
              <div className="py-14 text-center text-xs text-ink-muted">
                No placement trend records found.
              </div>
            ) : (
              <div className="mt-6 space-y-3.5">
                {placementTrends.map((row, idx) => {
                  const count = Number(row.total_placements) || 0;
                  const widthPct = Math.max(4, Math.round((count / maxTrendValue) * 100));
                  return (
                    <div key={`${row.month}-${row.year}-${idx}`} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-ink-secondary">
                          {row.month} {row.year || ''}
                        </span>
                        <span className="font-mono font-bold text-ink-primary">
                          {count}
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-input">
                        <div
                          className="h-full rounded-full bg-brand-500 transition-all"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border-subtle bg-surface-card p-6 xl:col-span-5">
            <div className="flex items-center gap-2.5 border-b border-border-subtle pb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-accent-emerald">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-ink-primary">
                  Package Analysis
                </h2>
                <p className="text-[11px] text-ink-muted">
                  From /api/analytics/package-analysis/
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5 rounded-xl border border-border-subtle bg-surface-input/50 p-3.5 text-center">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-ink-muted">
                  Average
                </p>
                <p className="mt-1 text-xs font-bold text-ink-primary">
                  {formatLpa(avgCtc)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-ink-muted">
                  Highest
                </p>
                <p className="mt-1 text-xs font-bold text-accent-emerald">
                  {formatLpa(highCtc)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-ink-muted">
                  Lowest
                </p>
                <p className="mt-1 text-xs font-bold text-accent-amber">
                  {formatLpa(lowCtc)}
                </p>
              </div>
            </div>

            {packageAnalysis.package_distribution.length === 0 ? (
              <div className="py-10 text-center text-xs text-ink-muted">
                No package range distribution available.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {packageAnalysis.package_distribution.map((bucket, idx) => {
                  const cnt = Number(bucket.count) || 0;
                  const pct = Math.max(
                    4,
                    Math.round((cnt / maxPackageRangeCount) * 100)
                  );
                  return (
                    <div key={`${bucket.range}-${idx}`} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-ink-secondary">
                          {bucket.range}
                        </span>
                        <span className="font-mono font-semibold text-ink-primary">
                          {cnt}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-input">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Department-wise + Company-wise */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <section className="rounded-xl border border-border-subtle bg-surface-card p-6 xl:col-span-6">
            <div className="flex items-center gap-2.5 border-b border-border-subtle pb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
                <GraduationCap className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-ink-primary">
                  Department-wise Placement
                </h2>
                <p className="text-[11px] text-ink-muted">
                  From /api/analytics/department-wise/
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-xs text-ink-muted">
                Loading department statistics...
              </div>
            ) : departmentWise.length === 0 ? (
              <div className="py-12 text-center text-xs text-ink-muted">
                No department placement statistics available.
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {departmentWise.map((dept, idx) => {
                  const pct = Math.min(
                    100,
                    Math.max(0, Number(dept.placement_percentage) || 0)
                  );
                  return (
                    <div
                      key={`${dept.department}-${idx}`}
                      className="rounded-xl border border-border-subtle bg-surface-input/40 p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-ink-primary">
                          {dept.department}
                        </span>
                        <span className="font-mono font-semibold text-accent-emerald">
                          {pct.toFixed(1)}% · Avg {formatLpa(dept.average_package)}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-card">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-ink-muted">
                        <span>
                          Placed: <strong className="text-ink-secondary">{dept.placed_students ?? 0}</strong> / {dept.total_students ?? 0}
                        </span>
                        <span>
                          Unplaced: <strong className="text-ink-secondary">{dept.unplaced_students ?? 0}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border-subtle bg-surface-card p-6 xl:col-span-6">
            <div className="flex items-center gap-2.5 border-b border-border-subtle pb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-accent-amber">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-ink-primary">
                  Company-wise Placements
                </h2>
                <p className="text-[11px] text-ink-muted">
                  From /api/analytics/company-wise/
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border-subtle text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                    <th className="py-2.5 pr-3">Company</th>
                    <th className="px-3 py-2.5 text-right">Placed</th>
                    <th className="px-3 py-2.5 text-right">Avg CTC</th>
                    <th className="py-2.5 pl-3 text-right">Highest</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/70 text-xs">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-ink-muted">
                        Loading company statistics...
                      </td>
                    </tr>
                  ) : companyWise.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-ink-muted">
                        No company placement data available.
                      </td>
                    </tr>
                  ) : (
                    companyWise.map((comp, idx) => (
                      <tr
                        key={`${comp.company}-${idx}`}
                        className="transition hover:bg-surface-elevated/40"
                      >
                        <td className="py-3 pr-3 font-semibold text-ink-primary">
                          {comp.company}
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-bold text-accent-emerald">
                          {comp.total_placements ?? 0}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-ink-secondary">
                          {formatLpa(comp.average_package)}
                        </td>
                        <td className="py-3 pl-3 text-right font-mono font-semibold text-ink-primary">
                          {formatLpa(comp.highest_package)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}