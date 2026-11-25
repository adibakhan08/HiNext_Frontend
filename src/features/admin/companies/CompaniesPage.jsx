import { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Globe,
  MapPin,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Users,
} from 'lucide-react';
import { axiosClient } from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import { Topbar } from '../../../components/layout/Topbar';
import { StatCard } from '../../../components/ui/StatCard';
import { CompanyFormModal } from './components/CompanyFormModal';

export function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await axiosClient.get(API_ENDPOINTS.ADMIN.COMPANIES);
      const list = Array.isArray(data) ? data : data.results || [];
      setCompanies(list);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          'Failed to load companies.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleOpenCreate = () => {
    setEditingCompany(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (company) => {
    setEditingCompany(company);
    setIsModalOpen(true);
  };

  const handleDelete = async (company) => {
    const confirmed = window.confirm(`Delete "${company.name}"?`);
    if (!confirmed) return;

    try {
      await axiosClient.delete(API_ENDPOINTS.ADMIN.COMPANY_DETAIL(company.id));
      setCompanies((prev) => prev.filter((c) => c.id !== company.id));
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          `Unable to delete ${company.name}.`
      );
    }
  };

  const sectors = [
    'ALL',
    ...Array.from(new Set(companies.map((c) => c.industry_sector).filter(Boolean))),
  ];

  const filteredCompanies = companies.filter((c) => {
    if (sectorFilter !== 'ALL' && c.industry_sector !== sectorFilter) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.industry_sector || '').toLowerCase().includes(q) ||
      (c.headquarters || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
  });

  const activeCount = companies.filter((c) => c.status === 'ACTIVE').length;

  return (
    <div className="flex flex-1 flex-col">
      <Topbar
        title="Companies"
        subtitle="Manage recruiting partners, industry sectors, and contact details"
      />

      <main className="flex-1 space-y-6 p-7">
        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Building2}
            badgeText="Directory"
            value={companies.length}
            label="Total Companies"
            caption="Registered recruiting partners"
            accent="amber"
          />

          <StatCard
            icon={Users}
            badgeText="Active"
            value={activeCount}
            label="Active Recruiters"
            caption="Open for campus drives"
            accent="emerald"
          />

          <StatCard
            icon={Globe}
            badgeText="Sectors"
            value={Math.max(sectors.length - 1, 0)}
            label="Industry Sectors"
            caption="Across registered companies"
            accent="indigo"
          />

          <StatCard
            icon={MapPin}
            badgeText="Locations"
            value={
              new Set(companies.map((c) => c.headquarters).filter(Boolean)).size
            }
            label="HQ Cities"
            caption="Hiring hubs"
            accent="violet"
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-1 min-w-[260px] flex-wrap items-center gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search company, sector, headquarters, email..."
                className="w-full rounded-lg border border-border-subtle bg-surface-input py-2 pl-9 pr-3.5 text-xs text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border-subtle bg-surface-input p-1">
              {sectors.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSectorFilter(sec)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
                    sectorFilter === sec
                      ? 'bg-brand-500 text-white'
                      : 'text-ink-secondary hover:text-ink-primary'
                  }`}
                >
                  {sec === 'ALL' ? 'All Sectors' : sec}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-xs font-semibold text-white shadow-brand-glow transition hover:bg-brand-600 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Company</span>
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Companies Table */}
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-card">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-input/60 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  <th className="px-5 py-3.5">Company</th>
                  <th className="px-5 py-3.5">Sector & Size</th>
                  <th className="px-5 py-3.5">Headquarters</th>
                  <th className="px-5 py-3.5">Contact</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border-subtle/70 text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-ink-muted">
                      Loading companies...
                    </td>
                  </tr>
                ) : filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center text-ink-muted">
                      No companies found. Click &ldquo;Add Company&rdquo; to create one.
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((company) => (
                    <tr
                      key={company.id}
                      className="transition hover:bg-surface-elevated/40"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/12 text-xs font-bold text-accent-amber">
                            {(company.name || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-ink-primary">{company.name}</p>
                            {company.website && (
                              <a
                                href={company.website}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-brand-400 hover:underline"
                              >
                                <Globe className="h-3 w-3" />
                                <span>{company.website.replace(/^https?:\/\//, '')}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <p className="font-medium text-ink-primary">
                          {company.industry_sector || '—'}
                        </p>
                        {company.company_size && (
                          <p className="mt-0.5 text-[11px] text-ink-muted">
                            Size: {company.company_size}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <p className="text-ink-primary">{company.headquarters || '—'}</p>
                        {company.address && (
                          <p className="mt-0.5 line-clamp-1 max-w-[200px] text-[11px] text-ink-muted">
                            {company.address}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="space-y-1 text-ink-secondary">
                          {company.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-ink-muted" />
                              <span>{company.email}</span>
                            </div>
                          )}
                          {company.phone && (
                            <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                              <Phone className="h-3 w-3" />
                              <span>{company.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            company.status === 'ACTIVE'
                              ? 'bg-emerald-500/15 text-accent-emerald'
                              : 'bg-ink-muted/15 text-ink-muted'
                          }`}
                        >
                          {company.status || 'ACTIVE'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(company)}
                            className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-input px-2.5 py-1.5 text-[11px] font-medium text-ink-secondary transition hover:border-brand-500/40 hover:text-brand-400 cursor-pointer"
                          >
                            <Pencil className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(company)}
                            className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-input px-2.5 py-1.5 text-[11px] font-medium text-ink-secondary transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <CompanyFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCompany(null);
        }}
        company={editingCompany}
        onSaved={fetchCompanies}
      />
    </div>
  );
}