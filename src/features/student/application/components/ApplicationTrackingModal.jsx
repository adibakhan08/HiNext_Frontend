import { useEffect, useState } from 'react';
import {
  X,
  Briefcase,
  MapPin,
  Clock,
  Video,
  ExternalLink,
  History,
  Award,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { axiosClient } from '../../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../../api/endpoints';

const STATUS_BADGE = {
  APPLIED: 'bg-indigo-500/15 text-indigo-400',
  UNDER_REVIEW: 'bg-sky-500/15 text-sky-400',
  SHORTLISTED: 'bg-emerald-500/15 text-accent-emerald',
  INTERVIEW: 'bg-violet-500/15 text-violet-400',
  OFFERED: 'bg-emerald-500/15 text-accent-emerald',
  SELECTED: 'bg-emerald-500/15 text-accent-emerald',
  REJECTED: 'bg-red-500/15 text-red-400',
  SCHEDULED: 'bg-indigo-500/15 text-indigo-400',
  COMPLETED: 'bg-emerald-500/15 text-accent-emerald',
  PASSED: 'bg-emerald-500/15 text-accent-emerald',
  FAILED: 'bg-red-500/15 text-red-400',
  PENDING: 'bg-amber-500/15 text-accent-amber',
  HOLD: 'bg-amber-500/15 text-accent-amber',
};

function normalizeEndpoint(url) {
  if (!url) return '';
  return url.startsWith('/') ? url : `/${url}`;
}

function formatDateTime(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatPackageRange(minVal, maxVal) {
  const minNum = parseFloat(minVal);
  const maxNum = parseFloat(maxVal);
  if (!minNum && !maxNum) return '—';
  const toLpa = (val) =>
    val >= 10000 ? `${(val / 100000).toFixed(1)}` : `${val}`;
  if (minNum && maxNum && minNum !== maxNum) {
    return `${toLpa(minNum)} – ${toLpa(maxNum)} LPA`;
  }
  return `${toLpa(maxNum || minNum)} LPA`;
}

export function ApplicationTrackingModal({ driveItem, onClose }) {
  const [trackingRecord, setTrackingRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!driveItem) {
      setTrackingRecord(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const targetDriveId = Number(driveItem.drive_id ?? driveItem.drive ?? driveItem.id);
    const targetAppId = driveItem.application_id ? Number(driveItem.application_id) : null;

    axiosClient
      .get(normalizeEndpoint(API_ENDPOINTS.STUDENT.APPLICATION_TRACKING))
      .then(({ data }) => {
        if (!isMounted) return;
        const results = Array.isArray(data) ? data : data?.results || [];
        const matched =
          results.find((r) => targetAppId && Number(r.id) === targetAppId) ||
          results.find((r) => Number(r.drive) === targetDriveId) ||
          results[0] ||
          null;
        setTrackingRecord(matched);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(
          err.response?.data?.detail ||
            err.response?.data?.message ||
            'Failed to load application tracking details.'
        );
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [driveItem]);

  if (!driveItem) return null;

  const record = trackingRecord || {};
  const companyName = record.company_name || driveItem.company_name || 'Company';
  const driveTitle = record.drive_title || driveItem.drive_title || 'Placement Drive';
  const jobRole = record.job_role || driveItem.job_role || '';
  const location = record.location || driveItem.location || '';
  const pkgMin = record.package_min ?? driveItem.package_min;
  const pkgMax = record.package_max ?? driveItem.package_max;
  const currentStatus = String(
    record.status || driveItem.application_status || 'APPLIED'
  ).toUpperCase();
  const statusHistory = Array.isArray(record.status_history)
    ? record.status_history
    : [];
  const interviews = Array.isArray(record.interviews) ? record.interviews : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-500/25 bg-brand-500/15 text-sm font-bold text-brand-400">
              {companyName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-base font-bold text-ink-primary">
                  {driveTitle}
                </h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                    STATUS_BADGE[currentStatus] || STATUS_BADGE.APPLIED
                  }`}
                >
                  {currentStatus.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="truncate text-xs text-ink-secondary">
                {companyName}
                {jobRole ? ` · ${jobRole}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-elevated hover:text-ink-primary cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-ink-muted">
            Loading tracking timeline &amp; interview schedule...
          </div>
        ) : error ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/30 p-3.5 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            {/* Summary Strip */}
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border-subtle bg-surface-input/50 p-4 sm:grid-cols-4 text-xs">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-ink-muted">
                  Package
                </p>
                <p className="mt-1 font-semibold text-accent-emerald">
                  {formatPackageRange(pkgMin, pkgMax)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-ink-muted">
                  Current Round
                </p>
                <p className="mt-1 flex items-center gap-1 font-semibold text-ink-primary">
                  <Layers className="h-3.5 w-3.5 text-brand-400" />
                  <span>Round {record.current_round ?? 1}</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-ink-muted">
                  Applied On
                </p>
                <p className="mt-1 font-medium text-ink-secondary">
                  {formatDateTime(record.applied_at)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-ink-muted">
                  Location
                </p>
                <p className="mt-1 flex items-center gap-1 font-medium text-ink-secondary">
                  <MapPin className="h-3.5 w-3.5 text-ink-muted" />
                  <span>{location || '—'}</span>
                </p>
              </div>
            </div>

            {record.remarks && (
              <div className="rounded-xl border border-border-subtle bg-surface-input/40 px-4 py-3 text-xs text-ink-secondary">
                <span className="font-semibold text-ink-primary">Remarks: </span>
                {record.remarks}
              </div>
            )}

            {/* Interviews Section */}
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                <Video className="h-3.5 w-3.5 text-brand-400" />
                <span>Interviews ({interviews.length})</span>
              </h3>

              {interviews.length === 0 ? (
                <div className="rounded-xl border border-border-subtle bg-surface-input/40 p-4 text-xs text-ink-muted">
                  No interviews scheduled yet for this application.
                </div>
              ) : (
                <div className="space-y-3">
                  {interviews.map((iv) => {
                    const ivStatus = String(iv.status || 'SCHEDULED').toUpperCase();
                    const ivResult = String(iv.result || 'PENDING').toUpperCase();

                    return (
                      <div
                        key={iv.id}
                        className="rounded-xl border border-border-subtle bg-surface-input/40 p-4 space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-ink-primary">
                              Round {iv.round_number}: {iv.round_name}
                            </p>
                            <p className="text-[11px] text-ink-muted">
                              {iv.round_type} · Total Marks: {iv.total_marks ?? 100}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                                STATUS_BADGE[ivStatus] || STATUS_BADGE.SCHEDULED
                              }`}
                            >
                              {ivStatus}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                                STATUS_BADGE[ivResult] || STATUS_BADGE.PENDING
                              }`}
                            >
                              {ivResult}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-ink-secondary">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-brand-400" />
                            {formatDateTime(iv.scheduled_at)} ({iv.duration_minutes || 60} mins)
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-accent-emerald" />
                            {iv.location || 'Online'}
                          </span>
                          {iv.meeting_link && (
                            <a
                              href={iv.meeting_link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-brand-400 hover:underline"
                            >
                              Meeting Link <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>

                        {(iv.score != null || iv.feedback || iv.remarks) && (
                          <div className="border-t border-border-subtle/70 pt-2 text-[11px] text-ink-secondary space-y-1">
                            {iv.score != null && (
                              <p className="flex items-center gap-1 font-semibold text-ink-primary">
                                <Award className="h-3.5 w-3.5 text-accent-emerald" />
                                <span>Score: {iv.score}</span>
                              </p>
                            )}
                            {iv.feedback && <p>Feedback: {iv.feedback}</p>}
                            {iv.remarks && <p className="text-ink-muted">Remarks: {iv.remarks}</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Status History Section */}
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                <History className="h-3.5 w-3.5 text-brand-400" />
                <span>Status History ({statusHistory.length})</span>
              </h3>

              {statusHistory.length === 0 ? (
                <div className="rounded-xl border border-border-subtle bg-surface-input/40 p-4 text-xs text-ink-muted">
                  No status history entries recorded yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {statusHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-border-subtle bg-surface-input/40 px-4 py-3 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-semibold text-ink-primary">
                          {entry.previous_status ? (
                            <>
                              <span className="text-ink-muted">
                                {entry.previous_status}
                              </span>
                              <span className="text-brand-400">→</span>
                            </>
                          ) : null}
                          <span className="text-accent-emerald">
                            {entry.new_status}
                          </span>
                        </div>
                        <span className="text-[11px] text-ink-muted">
                          {formatDateTime(entry.changed_at)}
                        </span>
                      </div>

                      {entry.remarks && (
                        <p className="mt-1 text-[11px] text-ink-secondary">
                          {entry.remarks}
                        </p>
                      )}
                      {entry.changed_by_name && (
                        <p className="mt-0.5 text-[10px] text-ink-muted">
                          Updated by {entry.changed_by_name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        <div className="mt-6 flex justify-end border-t border-border-subtle pt-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-input px-4 py-2 text-xs font-semibold text-ink-primary transition hover:bg-surface-elevated cursor-pointer"
          >
            <Briefcase className="h-3.5 w-3.5 text-brand-400" />
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
}