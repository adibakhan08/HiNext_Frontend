import { useEffect, useMemo, useState } from 'react';
import { X, CalendarPlus, CheckCircle2 } from 'lucide-react';
import { axiosClient } from '../../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../../api/endpoints';

function toIsoWithOffset(localStr) {
  if (!localStr) return null;
  const dt = new Date(localStr);
  if (Number.isNaN(dt.getTime())) return localStr;
  return dt.toISOString();
}

export function ScheduleInterviewModal({
  isOpen,
  onClose,
  driveId,
  rounds = [],
  preselectedApplicationId = '',
  onScheduled,
}) {
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState({
    application: '',
    interview_round: '',
    interviewer: '',
    scheduled_at: '',
    duration_minutes: '45',
    meeting_link: '',
    location: 'Online',
  });
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const eligibleApps = useMemo(() => {
    return applications.filter((app) => {
      const st = String(app.status || '').toUpperCase();
      return st === 'SHORTLISTED' || st === 'INTERVIEW';
    });
  }, [applications]);

  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setSuccessMsg(null);
    setForm({
      application: preselectedApplicationId ? String(preselectedApplicationId) : '',
      interview_round: rounds[0]?.id ? String(rounds[0].id) : '',
      interviewer: '',
      scheduled_at: '',
      duration_minutes: '45',
      meeting_link: '',
      location: 'Online',
    });

    if (driveId) {
      axiosClient
        .get(API_ENDPOINTS.ADMIN.APPLICATIONS, { params: { drive: driveId } })
        .then(({ data }) => {
          const list = Array.isArray(data) ? data : data.results || [];
          setApplications(list);
          const firstEligible = list.find((a) =>
            ['SHORTLISTED', 'INTERVIEW'].includes(String(a.status || '').toUpperCase())
          );
          if (preselectedApplicationId) {
            setForm((prev) => ({
              ...prev,
              application: String(preselectedApplicationId),
            }));
          } else if (firstEligible) {
            setForm((prev) => ({ ...prev, application: String(firstEligible.id) }));
          }
        })
        .catch(() => {
          setApplications([]);
        });
    }
  }, [isOpen, driveId, rounds, preselectedApplicationId]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    const payload = {
      application: Number(form.application),
      interview_round: Number(form.interview_round),
      ...(form.interviewer ? { interviewer: Number(form.interviewer) } : {}),
      scheduled_at: toIsoWithOffset(form.scheduled_at),
      duration_minutes: Number(form.duration_minutes) || 45,
      meeting_link: form.meeting_link.trim(),
      location: form.location.trim() || 'Online',
    };

    try {
      const { data } = await axiosClient.post(
        API_ENDPOINTS.ADMIN.INTERVIEWS,
        payload
      );
      setSuccessMsg('Interview scheduled successfully.');
      onScheduled?.(data);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 600);
    } catch (err) {
      const resData = err.response?.data;
      if (typeof resData === 'string') {
        setError(resData);
      } else if (resData && typeof resData === 'object') {
        const firstKey = Object.keys(resData)[0];
        const firstVal = Array.isArray(resData[firstKey])
          ? resData[firstKey][0]
          : resData[firstKey];
        setError(
          resData.detail ||
            resData.message ||
            resData.non_field_errors?.[0] ||
            `${firstKey}: ${firstVal}` ||
            'Failed to schedule interview.'
        );
      } else {
        setError('Network error while scheduling interview.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-500/25 bg-indigo-500/15 text-indigo-400">
              <CalendarPlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink-primary">
                Schedule Interview
              </h2>
              <p className="text-xs text-ink-muted">
                Requires a SHORTLISTED or INTERVIEW candidate application in this drive
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-elevated hover:text-ink-primary cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-950/30 px-3.5 py-2.5 text-xs text-red-300">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-3.5 py-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="application" className="block text-xs font-medium text-ink-secondary">
              Candidate Application (SHORTLISTED / INTERVIEW)
            </label>
            {eligibleApps.length > 0 ? (
              <select
                id="application"
                name="application"
                required
                value={form.application}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none"
              >
                {eligibleApps.map((app) => (
                  <option key={app.id} value={app.id} className="bg-surface-card">
                    #{app.id} — {app.candidate_name || `Candidate #${app.candidate}`} ({app.status})
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="application"
                name="application"
                type="number"
                min="1"
                required
                placeholder="Application ID (e.g. 10)"
                value={form.application}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none"
              />
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="interview_round" className="block text-xs font-medium text-ink-secondary">
                Interview Round
              </label>
              {rounds.length > 0 ? (
                <select
                  id="interview_round"
                  name="interview_round"
                  required
                  value={form.interview_round}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none"
                >
                  {rounds.map((r) => (
                    <option key={r.id} value={r.id} className="bg-surface-card">
                      #{r.id} — R{r.round_number}: {r.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="interview_round"
                  name="interview_round"
                  type="number"
                  min="1"
                  required
                  placeholder="Round ID (e.g. 1)"
                  value={form.interview_round}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="interviewer" className="block text-xs font-medium text-ink-secondary">
                Interviewer ID
              </label>
              <input
                id="interviewer"
                name="interviewer"
                type="number"
                min="1"
                placeholder="e.g. 2"
                value={form.interviewer}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="scheduled_at" className="block text-xs font-medium text-ink-secondary">
                Scheduled Date &amp; Time
              </label>
              <input
                id="scheduled_at"
                name="scheduled_at"
                type="datetime-local"
                required
                value={form.scheduled_at}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-xs text-ink-primary focus:border-border-focus focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="duration_minutes" className="block text-xs font-medium text-ink-secondary">
                Duration (Minutes)
              </label>
              <input
                id="duration_minutes"
                name="duration_minutes"
                type="number"
                min="5"
                max="360"
                required
                value={form.duration_minutes}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="location" className="block text-xs font-medium text-ink-secondary">
                Location / Mode
              </label>
              <input
                id="location"
                name="location"
                type="text"
                placeholder="Online / Room 204"
                value={form.location}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="meeting_link" className="block text-xs font-medium text-ink-secondary">
                Meeting Link
              </label>
              <input
                id="meeting_link"
                name="meeting_link"
                type="url"
                placeholder="https://meet.example.com/interview"
                value={form.meeting_link}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border-subtle pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border-subtle bg-surface-input px-4 py-2 text-xs font-medium text-ink-secondary transition hover:bg-surface-elevated hover:text-ink-primary cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-brand-glow transition hover:bg-brand-600 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}