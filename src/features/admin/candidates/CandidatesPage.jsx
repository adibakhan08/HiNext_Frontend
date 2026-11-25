import { useCallback, useEffect, useState } from 'react';
import {
  UserPlus,
  Search,
  Mail,
  Phone,
  Users,
  Eye,
  Filter,
} from 'lucide-react';
import { axiosClient } from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import { Topbar } from '../../../components/layout/Topbar';
import { AddStudentModal } from './components/AddStudentModal';
import { CandidateDetailDrawer } from './components/CandidateDetailDrawer';

export function CandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileFilter, setProfileFilter] = useState('ALL'); // 'ALL' | 'COMPLETED' | 'PENDING'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);

  const fetchCandidates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await axiosClient.get(API_ENDPOINTS.ADMIN.CANDIDATES);
      const list = Array.isArray(data) ? data : data.results || [];
      setCandidates(list);
      setTotalCount(data.count ?? list.length);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          'Failed to load candidates.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const filteredCandidates = candidates.filter((item) => {
    const isProfileComplete = Boolean(item.enrollment_number && item.department_name);

    if (profileFilter === 'COMPLETED' && !isProfileComplete) return false;
    if (profileFilter === 'PENDING' && isProfileComplete) return false;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    const fullName = `${item.first_name || ''} ${item.last_name || ''}`.toLowerCase();
    const dept = (item.department_name || '').toLowerCase();
    const course = (item.course_name || '').toLowerCase();
    const enrollment = (item.enrollment_number || '').toLowerCase();

    return (
      fullName.includes(q) ||
      (item.username || '').toLowerCase().includes(q) ||
      (item.email || '').toLowerCase().includes(q) ||
      (item.phone || '').includes(q) ||
      dept.includes(q) ||
      course.includes(q) ||
      enrollment.includes(q)
    );
  });

  return (
    <div className="flex flex-1 flex-col">
      <Topbar
        title="Candidates"
        subtitle={`Managing ${totalCount} registered student profiles`}
      />

      <main className="flex-1 space-y-6 p-7">
        {/* Top Toolbar: Search, Filter & Add Student */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, username, enrollment, branch..."
                className="w-full rounded-lg border border-border-subtle bg-surface-input py-2 pl-9 pr-3.5 text-xs text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {/* Profile Status Filter Pills */}
            <div className="flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-input p-1 text-xs">
              <Filter className="ml-2 mr-1 h-3.5 w-3.5 text-ink-muted" />
              {[
                { key: 'ALL', label: `All (${totalCount})` },
                { key: 'COMPLETED', label: 'Profile Complete' },
                { key: 'PENDING', label: 'Pending Details' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setProfileFilter(tab.key)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
                    profileFilter === tab.key
                      ? 'bg-brand-500 text-white'
                      : 'text-ink-secondary hover:text-ink-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-xs font-semibold text-white shadow-brand-glow transition hover:bg-brand-600 cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Student</span>
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Candidates Directory Table */}
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-card">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-input/60 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-5 py-3.5">Enrollment & Branch</th>
                  <th className="px-5 py-3.5">CGPA / Backlogs</th>
                  <th className="px-5 py-3.5">Contact</th>
                  <th className="px-5 py-3.5">Profile Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border-subtle/70 text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-ink-muted">
                      Loading candidates...
                    </td>
                  </tr>
                ) : filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center">
                      <div className="mx-auto flex max-w-xs flex-col items-center gap-2">
                        <Users className="h-6 w-6 text-ink-muted" />
                        <p className="font-medium text-ink-secondary">
                          No candidates found
                        </p>
                        <p className="text-[11px] text-ink-muted">
                          Click &ldquo;Add Student&rdquo; to register a new candidate account.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((item) => {
                    const fullName =
                      `${item.first_name || ''} ${item.last_name || ''}`.trim() ||
                      item.username ||
                      'Candidate';

                    const branchText = [item.course_name, item.department_name]
                      .filter(Boolean)
                      .join(' · ');

                    const isProfileComplete = Boolean(
                      item.enrollment_number && item.department_name
                    );

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedCandidateId(item.id)}
                        className="transition hover:bg-surface-elevated/40 cursor-pointer"
                      >
                        {/* Candidate Name, Avatar & Username */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {item.profile_photo ? (
                              <img
                                src={item.profile_photo}
                                alt={fullName}
                                className="h-8 w-8 shrink-0 rounded-full object-cover border border-border-subtle"
                              />
                            ) : (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-500/25 bg-brand-500/15 text-xs font-bold text-brand-400">
                                {fullName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-ink-primary">{fullName}</p>
                              <p className="font-mono text-[11px] text-ink-muted">
                                @{item.username}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Enrollment Number, Course & Department */}
                        <td className="px-5 py-3.5">
                          <p className="font-mono text-[11px] font-medium text-ink-primary">
                            {item.enrollment_number || 'Not Assigned'}
                          </p>
                          <p className="mt-0.5 text-[11px] text-ink-secondary">
                            {branchText || 'Academic details pending'}
                            {item.graduation_year ? ` (${item.graduation_year})` : ''}
                          </p>
                        </td>

                        {/* CGPA & Backlogs */}
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-ink-primary">
                            {item.current_cgpa ?? '—'}
                          </p>
                          <p className="mt-0.5 text-[11px] text-ink-muted">
                            Backlogs: {item.backlogs ?? 0}
                          </p>
                        </td>

                        {/* Email & Phone */}
                        <td className="px-5 py-3.5">
                          <div className="space-y-1 text-ink-secondary">
                            {item.email && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5 text-ink-muted" />
                                <span>{item.email}</span>
                              </div>
                            )}
                            {item.phone && (
                              <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                                <Phone className="h-3 w-3" />
                                <span>{item.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Profile Completion Badge */}
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              isProfileComplete
                                ? 'bg-emerald-500/15 text-accent-emerald'
                                : 'bg-amber-500/15 text-accent-amber'
                            }`}
                          >
                            {isProfileComplete ? 'Complete' : 'Pending'}
                          </span>
                        </td>

                        {/* View Details Action */}
                        <td
                          className="px-5 py-3.5 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedCandidateId(item.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-input px-3 py-1.5 text-[11px] font-medium text-ink-secondary transition hover:border-brand-500/40 hover:bg-brand-500/10 hover:text-brand-400 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Student Modal (POST /api/auth/admin/students/create/) */}
      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={fetchCandidates}
      />

      {/* Candidate Details Drawer (GET /api/admin/candidates/<id>/) */}
      <CandidateDetailDrawer
        candidateId={selectedCandidateId}
        onClose={() => setSelectedCandidateId(null)}
      />
    </div>
  );
}