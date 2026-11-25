import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  X,
  Briefcase,
  Search,
  Users,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Save,
  Layers,
  Video,
  Plus,
  CalendarPlus,
  Award,
  Clock,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { axiosClient } from '../../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../../api/endpoints';
import { CreateRoundModal } from './CreateRoundModal';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';
import { SubmitResultModal } from './SubmitResultModal';

const PIPELINE_STAGES = [
  { value: 'APPLIED', label: 'Applied' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'INTERVIEW', label: 'Interview' },
  { value: 'SELECTED', label: 'Selected' },
  { value: 'OFFERED', label: 'Offered' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'DECLINED', label: 'Declined' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
];

const STAGE_STYLES = {
  APPLIED: 'bg-sky-500/15 text-sky-400 border-sky-500/25',
  UNDER_REVIEW: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  SHORTLISTED: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
  REJECTED: 'bg-red-500/15 text-red-400 border-red-500/25',
  INTERVIEW: 'bg-amber-500/15 text-accent-amber border-amber-500/25',
  SELECTED: 'bg-emerald-500/15 text-accent-emerald border-emerald-500/25',
  OFFERED: 'bg-teal-500/15 text-teal-400 border-teal-500/25',
  ACCEPTED: 'bg-green-500/15 text-green-400 border-green-500/25',
  DECLINED: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
  WITHDRAWN: 'bg-zinc-500/15 text-ink-secondary border-zinc-500/25',
};

const INTERVIEW_STATUS_BADGE = {
  SCHEDULED: 'bg-indigo-500/15 text-indigo-400',
  COMPLETED: 'bg-emerald-500/15 text-accent-emerald',
  NO_SHOW: 'bg-amber-500/15 text-accent-amber',
  CANCELLED: 'bg-red-500/15 text-red-400',
  RESCHEDULED: 'bg-sky-500/15 text-sky-400',
};

const RESULT_BADGE = {
  PASSED: 'bg-emerald-500/15 text-accent-emerald',
  FAILED: 'bg-red-500/15 text-red-400',
  HOLD: 'bg-amber-500/15 text-accent-amber',
  PENDING: 'bg-surface-card text-ink-secondary',
};

function getStatusEndpoint(appId) {
  return (
    API_ENDPOINTS.ADMIN.APPLICATION_STATUS?.(appId) ||
    `/api/applications/${appId}/status/`
  );
}

function formatDateTime(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function DriveEnrollmentsDrawer({
  drive,
  onClose,
  onApplicationUpdated,
}) {
  const [activeTab, setActiveTab] = useState('CANDIDATES'); // 'CANDIDATES' | 'INTERVIEWS'

  const [applications, setApplications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [stageFilter, setStageFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAppId, setExpandedAppId] = useState(null);
  const [editDrafts, setEditDrafts] = useState({});
  const [updatingId, setUpdatingId] = useState(null);

  const [rounds, setRounds] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [isLoadingInterviews, setIsLoadingInterviews] = useState(false);
  const [selectedRoundFilter, setSelectedRoundFilter] = useState('');
  const [interviewStatusFilter, setInterviewStatusFilter] = useState('');

  const [isRoundModalOpen, setIsRoundModalOpen] = useState(false);
  const [scheduleModalState, setScheduleModalState] = useState({
    isOpen: false,
    preselectedAppId: '',
  });
  const [resultTargetInterview, setResultTargetInterview] = useState(null);

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchApplications = useCallback(async () => {
    if (!drive?.id) return;
    setIsLoadingApps(true);
    try {
      const { data } = await axiosClient.get(API_ENDPOINTS.ADMIN.APPLICATIONS, {
        params: { drive: drive.id },
      });
      const list = Array.isArray(data) ? data : data.results || [];
      setApplications(list);
      setTotalCount(data.count ?? list.length);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          'Failed to load enrolled candidates.'
      );
    } finally {
      setIsLoadingApps(false);
    }
  }, [drive]);

  const fetchRoundsAndInterviews = useCallback(async () => {
    if (!drive?.id) return;
    setIsLoadingInterviews(true);

    const interviewParams = { drive: drive.id };
    if (selectedRoundFilter) interviewParams.round = Number(selectedRoundFilter);
    if (interviewStatusFilter) interviewParams.status = interviewStatusFilter;

    const [roundsRes, interviewsRes] = await Promise.allSettled([
      axiosClient.get(API_ENDPOINTS.ADMIN.INTERVIEW_ROUNDS, {
        params: { drive: drive.id },
      }),
      axiosClient.get(API_ENDPOINTS.ADMIN.INTERVIEWS, {
        params: interviewParams,
      }),
    ]);

    if (roundsRes.status === 'fulfilled') {
      const rData = roundsRes.value.data;
      setRounds(Array.isArray(rData) ? rData : rData.results || []);
    }

    if (interviewsRes.status === 'fulfilled') {
      const iData = interviewsRes.value.data;
      setInterviews(Array.isArray(iData) ? iData : iData.results || []);
    }

    setIsLoadingInterviews(false);
  }, [drive, selectedRoundFilter, interviewStatusFilter]);

  useEffect(() => {
    setActiveTab('CANDIDATES');
    setStageFilter('ALL');
    setSearchQuery('');
    setExpandedAppId(null);
    setEditDrafts({});
    setSelectedRoundFilter('');
    setInterviewStatusFilter('');
    setError(null);
    setSuccessMsg(null);

    if (!drive?.id) {
      setApplications([]);
      setRounds([]);
      setInterviews([]);
      return;
    }

    fetchApplications();
    fetchRoundsAndInterviews();
  }, [drive, fetchApplications, fetchRoundsAndInterviews]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const statusKey = String(app.status || 'APPLIED').toUpperCase();
      if (stageFilter !== 'ALL' && statusKey !== stageFilter) return false;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const candidateName = String(app.candidate_name || '').toLowerCase();
      const resumeTitle = String(app.resume_title || '').toLowerCase();
      const remarks = String(app.remarks || '').toLowerCase();

      return (
        candidateName.includes(q) ||
        resumeTitle.includes(q) ||
        remarks.includes(q) ||
        String(app.candidate || '').includes(q)
      );
    });
  }, [applications, stageFilter, searchQuery]);

  if (!drive) return null;

  const companyName =
    drive.company_name || drive.company?.name || `Company #${drive.company}`;

  const handleInlineStageChange = async (app, newStatus) => {
    setUpdatingId(app.id);
    setError(null);
    setSuccessMsg(null);

    const payload = {
      status: newStatus,
      current_round: Number(app.current_round ?? 1) || 1,
      remarks: String(app.remarks ?? '').trim(),
    };

    try {
      const { data } = await axiosClient.patch(getStatusEndpoint(app.id), payload);
      const merged = { ...app, ...data, ...payload };
      setApplications((prev) =>
        prev.map((item) => (item.id === app.id ? merged : item))
      );
      onApplicationUpdated?.(merged);
      setSuccessMsg(`${app.candidate_name || 'Candidate'} moved to ${newStatus}.`);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          'Unable to update candidate status.'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleExpandRow = (app) => {
    if (expandedAppId === app.id) {
      setExpandedAppId(null);
      return;
    }
    setEditDrafts((prev) => ({
      ...prev,
      [app.id]: {
        status: String(app.status || 'SHORTLISTED').toUpperCase(),
        current_round: app.current_round ?? 1,
        remarks: app.remarks ?? '',
      },
    }));
    setExpandedAppId(app.id);
  };

  const handleSaveRoundAndRemarks = async (app) => {
    const draft = editDrafts[app.id] || {
      status: String(app.status || 'SHORTLISTED').toUpperCase(),
      current_round: app.current_round ?? 1,
      remarks: app.remarks ?? '',
    };

    setUpdatingId(app.id);
    setError(null);
    setSuccessMsg(null);

    const payload = {
      status: draft.status || String(app.status || 'SHORTLISTED').toUpperCase(),
      current_round: Number(draft.current_round) || 1,
      remarks: String(draft.remarks || '').trim(),
    };

    try {
      const { data } = await axiosClient.patch(getStatusEndpoint(app.id), payload);
      const merged = { ...app, ...data, ...payload };
      setApplications((prev) =>
        prev.map((item) => (item.id === app.id ? merged : item))
      );
      onApplicationUpdated?.(merged);
      setSuccessMsg(`Updated status, round & remarks for ${app.candidate_name}.`);
      setExpandedAppId(null);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          'Unable to update round and remarks.'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs">
      <div className="flex h-full w-full max-w-2xl flex-col border-l border-border-subtle bg-surface-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-500/25 bg-brand-500/15 text-brand-400">
              <Briefcase className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-base font-bold text-ink-primary">
                  {applications[0]?.drive_title || drive.title}
                </h2>
                <span className="shrink-0 rounded-full bg-brand-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-brand-400">
                  {totalCount} Enrolled
                </span>
              </div>
              <p className="truncate text-xs text-ink-muted">
                {companyName} · {drive.job_role}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-elevated hover:text-ink-primary cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-border-subtle bg-surface-input/30 px-6 py-2.5">
          <div className="flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface-input p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('CANDIDATES');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition cursor-pointer ${
                activeTab === 'CANDIDATES'
                  ? 'bg-brand-500 text-white shadow-brand-glow'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Enrolled Candidates ({totalCount})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('INTERVIEWS');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition cursor-pointer ${
                activeTab === 'INTERVIEWS'
                  ? 'bg-brand-500 text-white shadow-brand-glow'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              <Video className="h-3.5 w-3.5" />
              <span>
                Rounds &amp; Interviews ({rounds.length}R · {interviews.length})
              </span>
            </button>
          </div>
        </div>

        {(error || successMsg) && (
          <div className="px-6 pt-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'CANDIDATES' && (
          <>
            <div className="space-y-3 border-b border-border-subtle bg-surface-input/40 px-6 py-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search candidate name, resume title, or remarks..."
                  className="w-full rounded-lg border border-border-subtle bg-surface-input py-2 pl-8 pr-3 text-xs text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { value: 'ALL', label: `All (${applications.length})` },
                  ...PIPELINE_STAGES,
                ].map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setStageFilter(tab.value)}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium transition cursor-pointer ${
                      stageFilter === tab.value
                        ? 'bg-brand-500 text-white shadow-brand-glow'
                        : 'border border-border-subtle bg-surface-card text-ink-secondary hover:text-ink-primary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-6">
              {isLoadingApps ? (
                <div className="rounded-xl border border-border-subtle bg-surface-input/40 p-12 text-center text-xs text-ink-muted">
                  Loading enrolled candidates...
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="rounded-xl border border-border-subtle bg-surface-input/40 p-12 text-center">
                  <Users className="mx-auto h-7 w-7 text-ink-muted" />
                  <p className="mt-2 text-xs font-medium text-ink-secondary">
                    No enrolled candidates match this filter
                  </p>
                </div>
              ) : (
                filteredApplications.map((app) => {
                  const candidateName =
                    app.candidate_name || `Candidate #${app.candidate ?? app.id}`;
                  const statusKey = String(app.status || 'APPLIED').toUpperCase();
                  const canSchedule =
                    statusKey === 'SHORTLISTED' || statusKey === 'INTERVIEW';
                  const isExpanded = expandedAppId === app.id;
                  const draft = editDrafts[app.id] || {
                    status: statusKey,
                    current_round: app.current_round ?? 1,
                    remarks: app.remarks ?? '',
                  };

                  return (
                    <div
                      key={app.id}
                      className="rounded-xl border border-border-subtle bg-surface-input/40 p-4 transition hover:border-brand-500/30"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-500/25 bg-brand-500/15 text-xs font-bold text-brand-400">
                            {candidateName.charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-xs font-bold text-ink-primary">
                                {candidateName}
                              </p>
                              <span className="rounded-md bg-surface-card px-2 py-0.5 font-mono text-[10px] text-ink-muted">
                                App #{app.id}
                              </span>
                              {app.current_round != null && (
                                <span className="inline-flex items-center gap-1 rounded-md border border-indigo-500/25 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                                  <Layers className="h-2.5 w-2.5" />
                                  Round {app.current_round}
                                </span>
                              )}
                            </div>

                            {app.resume_title && (
                              <p className="flex items-center gap-1.5 text-[11px] text-ink-secondary">
                                <FileText className="h-3 w-3 shrink-0 text-brand-400" />
                                <span className="truncate">
                                  {app.resume_title} (Resume #{app.resume})
                                </span>
                              </p>
                            )}

                            {app.remarks && (
                              <p className="text-[11px] italic text-ink-muted">
                                “{app.remarks}”
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {canSchedule && (
                            <button
                              type="button"
                              onClick={() =>
                                setScheduleModalState({
                                  isOpen: true,
                                  preselectedAppId: String(app.id),
                                })
                              }
                              title="Schedule interview slot for this candidate"
                              className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/15 px-2.5 py-1 text-[11px] font-semibold text-indigo-300 transition hover:bg-indigo-500 hover:text-white cursor-pointer"
                            >
                              <CalendarPlus className="h-3 w-3" />
                              <span>Schedule</span>
                            </button>
                          )}

                          <select
                            value={statusKey}
                            disabled={updatingId === app.id}
                            onChange={(e) => handleInlineStageChange(app, e.target.value)}
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold focus:outline-none cursor-pointer ${
                              STAGE_STYLES[statusKey] || STAGE_STYLES.APPLIED
                            }`}
                          >
                            {PIPELINE_STAGES.map((opt) => (
                              <option
                                key={opt.value}
                                value={opt.value}
                                className="bg-surface-card text-ink-primary"
                              >
                                {opt.label}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => toggleExpandRow(app)}
                            title="Edit status, round & remarks"
                            className="rounded-lg border border-border-subtle bg-surface-card p-1.5 text-ink-muted transition hover:text-ink-primary cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-3.5 grid grid-cols-1 gap-3 border-t border-border-subtle/70 pt-3 sm:grid-cols-[155px_90px_1fr_auto] sm:items-end">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                              Status
                            </label>
                            <select
                              value={draft.status}
                              onChange={(e) =>
                                setEditDrafts((prev) => ({
                                  ...prev,
                                  [app.id]: {
                                    ...draft,
                                    status: e.target.value,
                                  },
                                }))
                              }
                              className="w-full rounded-lg border border-border-subtle bg-surface-input px-2.5 py-1.5 text-xs text-ink-primary focus:border-border-focus focus:outline-none"
                            >
                              {PIPELINE_STAGES.map((opt) => (
                                <option
                                  key={opt.value}
                                  value={opt.value}
                                  className="bg-surface-card"
                                >
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                              Round
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={draft.current_round}
                              onChange={(e) =>
                                setEditDrafts((prev) => ({
                                  ...prev,
                                  [app.id]: {
                                    ...draft,
                                    current_round: e.target.value,
                                  },
                                }))
                              }
                              className="w-full rounded-lg border border-border-subtle bg-surface-input px-2.5 py-1.5 text-xs text-ink-primary focus:border-border-focus focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                              Remarks
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Candidate shortlisted for aptitude assessment."
                              value={draft.remarks}
                              onChange={(e) =>
                                setEditDrafts((prev) => ({
                                  ...prev,
                                  [app.id]: {
                                    ...draft,
                                    remarks: e.target.value,
                                  },
                                }))
                              }
                              className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-1.5 text-xs text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            disabled={updatingId === app.id}
                            onClick={() => handleSaveRoundAndRemarks(app)}
                            className="inline-flex items-center justify-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-60 cursor-pointer"
                          >
                            <Save className="h-3 w-3" />
                            <span>Save</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {activeTab === 'INTERVIEWS' && (
          <div className="flex-1 space-y-5 overflow-y-auto p-6">
            <section className="space-y-3 rounded-xl border border-border-subtle bg-surface-input/40 p-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  <Layers className="h-3.5 w-3.5 text-brand-400" />
                  <span>Interview Rounds ({rounds.length})</span>
                </h3>

                <button
                  type="button"
                  onClick={() => setIsRoundModalOpen(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-card px-2.5 py-1.5 text-[11px] font-semibold text-ink-primary transition hover:border-brand-500/40 cursor-pointer"
                >
                  <Plus className="h-3 w-3 text-brand-400" />
                  <span>Add Round</span>
                </button>
              </div>

              {rounds.length === 0 ? (
                <p className="text-xs text-ink-muted">
                  No rounds configured for this drive yet. Click “Add Round” first before scheduling interviews.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {rounds.map((r) => {
                    const isSelected = String(selectedRoundFilter) === String(r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() =>
                          setSelectedRoundFilter((prev) =>
                            String(prev) === String(r.id) ? '' : String(r.id)
                          )
                        }
                        className={`rounded-xl border px-3 py-2 text-left transition cursor-pointer ${
                          isSelected
                            ? 'border-brand-500 bg-brand-500/20 text-ink-primary'
                            : 'border-border-subtle bg-surface-card text-ink-secondary hover:border-brand-500/35'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <span className="rounded bg-brand-500/15 px-1.5 py-0.5 font-mono text-[10px] text-brand-400">
                            R{r.round_number}
                          </span>
                          <span>{r.name}</span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-ink-muted">
                          {r.round_type} · Marks: {r.total_marks ?? 100}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <select
                  value={interviewStatusFilter}
                  onChange={(e) => setInterviewStatusFilter(e.target.value)}
                  className="rounded-lg border border-border-subtle bg-surface-input px-3 py-1.5 text-xs text-ink-primary focus:border-border-focus focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="NO_SHOW">NO_SHOW</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>

                {selectedRoundFilter && (
                  <button
                    type="button"
                    onClick={() => setSelectedRoundFilter('')}
                    className="text-[11px] font-medium text-brand-400 hover:underline cursor-pointer"
                  >
                    Clear round filter
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setScheduleModalState({ isOpen: true, preselectedAppId: '' })
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-brand-glow transition hover:bg-brand-600 cursor-pointer"
              >
                <CalendarPlus className="h-3.5 w-3.5" />
                <span>Schedule Interview</span>
              </button>
            </div>

            {isLoadingInterviews ? (
              <div className="rounded-xl border border-border-subtle bg-surface-input/40 p-10 text-center text-xs text-ink-muted">
                Loading scheduled interviews...
              </div>
            ) : interviews.length === 0 ? (
              <div className="rounded-xl border border-border-subtle bg-surface-input/40 p-10 text-center">
                <Video className="mx-auto h-7 w-7 text-ink-muted" />
                <p className="mt-2 text-xs font-medium text-ink-secondary">
                  No interviews scheduled yet
                </p>
                <p className="mt-1 text-[11px] text-ink-muted">
                  Shortlist candidates in the Enrolled Candidates tab, then schedule their interview rounds here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {interviews.map((item) => {
                  const stKey = String(item.status || 'SCHEDULED').toUpperCase();
                  const resKey = String(item.result || 'PENDING').toUpperCase();

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border-subtle bg-surface-input/40 p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-bold text-ink-primary">
                              {item.candidate_name ||
                                `Application #${item.application}`}
                            </p>
                            <span className="rounded bg-surface-card px-2 py-0.5 font-mono text-[10px] text-ink-muted">
                              Interview #{item.id}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                                INTERVIEW_STATUS_BADGE[stKey] ||
                                INTERVIEW_STATUS_BADGE.SCHEDULED
                              }`}
                            >
                              {stKey}
                            </span>
                          </div>

                          <p className="text-[11px] font-medium text-brand-400">
                            {item.round_name ||
                              item.interview_round_name ||
                              `Round #${item.interview_round}`}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setResultTargetInterview(item)}
                          className="inline-flex items-center gap-1 rounded-lg bg-brand-500/15 px-3 py-1.5 text-[11px] font-semibold text-brand-400 transition hover:bg-brand-500 hover:text-white cursor-pointer"
                        >
                          <Award className="h-3 w-3" />
                          <span>Submit Result</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle/70 pt-2.5 text-[11px] text-ink-muted">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-brand-400" />
                            {formatDateTime(item.scheduled_at)} ({item.duration_minutes || 45}m)
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-accent-emerald" />
                            {item.location || 'Online'}
                          </span>
                          {item.meeting_link && (
                            <a
                              href={item.meeting_link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-0.5 font-medium text-brand-400 hover:underline"
                            >
                              Join <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                              RESULT_BADGE[resKey] || RESULT_BADGE.PENDING
                            }`}
                          >
                            {resKey}
                          </span>
                          {item.score != null && item.score !== '' && (
                            <span className="font-mono text-xs font-bold text-ink-primary">
                              {item.score}
                            </span>
                          )}
                        </div>
                      </div>

                      {item.feedback && (
                        <p className="text-[11px] italic text-ink-secondary">
                          Feedback: “{item.feedback}”
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <CreateRoundModal
        isOpen={isRoundModalOpen}
        onClose={() => setIsRoundModalOpen(false)}
        driveId={drive.id}
        nextRoundNumber={rounds.length + 1}
        onCreated={() => {
          fetchRoundsAndInterviews();
          setSuccessMsg('Interview round created.');
        }}
      />

      <ScheduleInterviewModal
        isOpen={scheduleModalState.isOpen}
        onClose={() =>
          setScheduleModalState({ isOpen: false, preselectedAppId: '' })
        }
        driveId={drive.id}
        rounds={rounds}
        preselectedApplicationId={scheduleModalState.preselectedAppId}
        onScheduled={() => {
          fetchRoundsAndInterviews();
          fetchApplications();
          setActiveTab('INTERVIEWS');
          setSuccessMsg('Interview scheduled.');
        }}
      />

      <SubmitResultModal
        interview={resultTargetInterview}
        onClose={() => setResultTargetInterview(null)}
        onSubmitted={() => {
          fetchRoundsAndInterviews();
          fetchApplications();
          setSuccessMsg('Interview evaluation submitted.');
        }}
      />
    </div>
  );
}