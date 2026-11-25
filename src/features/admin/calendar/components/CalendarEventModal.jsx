import { useEffect, useState } from 'react';
import { X, CalendarPlus, CheckCircle2 } from 'lucide-react';
import { axiosClient } from '../../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../../api/endpoints';

const INITIAL_FORM = {
  title: '',
  event_type: 'DRIVE',
  start_datetime: '',
  end_datetime: '',
  location: '',
  meeting_link: '',
  status: 'UPCOMING',
  drive: '',
  description: '',
};

const EVENT_TYPES = [
  { value: 'DRIVE', label: 'Campus Drive' },
  { value: 'APPLICATION_OPEN', label: 'Application Window Opens' },
  { value: 'APPLICATION_DEADLINE', label: 'Application Deadline' },
  { value: 'PPT', label: 'Pre-Placement Talk (PPT)' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'RESULTS', label: 'Results' },
  { value: 'MEETING', label: 'Meeting' },
];

const STATUS_OPTIONS = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'];

function toDateTimeLocal(isoStr) {
  if (!isoStr) return '';
  return isoStr.slice(0, 16);
}

function toIsoUtc(localStr) {
  if (!localStr) return null;
  if (localStr.endsWith('Z')) return localStr;
  return localStr.length === 16 ? `${localStr}:00Z` : new Date(localStr).toISOString();
}

export function CalendarEventModal({ isOpen, onClose, event, onSaved }) {
  const isEditing = Boolean(event?.id);
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title || '',
        event_type: event.event_type || 'DRIVE',
        start_datetime: toDateTimeLocal(event.start_datetime),
        end_datetime: toDateTimeLocal(event.end_datetime || event.start_datetime),
        location: event.location || '',
        meeting_link: event.meeting_link || '',
        status: event.status || 'UPCOMING',
        drive: event.drive ? String(event.drive) : '',
        description: event.description || '',
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setError(null);
    setSuccessMsg(null);
  }, [event, isOpen]);

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

    const startIso = toIsoUtc(form.start_datetime);
    const endIso = toIsoUtc(form.end_datetime) || startIso;

    const payload = {
      title: form.title.trim(),
      event_type: form.event_type,
      start_datetime: startIso,
      end_datetime: endIso,
      location: form.location.trim(),
      meeting_link: form.meeting_link.trim(),
      status: form.status,
      description: form.description.trim(),
      ...(form.drive ? { drive: Number(form.drive) } : {}),
    };

    try {
      const { data } = isEditing
        ? await axiosClient.patch(
            API_ENDPOINTS.ADMIN.CALENDAR_DETAIL(event.id),
            payload
          )
        : await axiosClient.post(API_ENDPOINTS.ADMIN.CALENDAR, payload);

      setSuccessMsg(isEditing ? 'Event updated.' : 'Event added to calendar.');
      onSaved?.(data);
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
            `${firstKey}: ${firstVal}` ||
            'Failed to save calendar event.'
        );
      } else {
        setError('Network error while saving calendar event.');
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-500/25 bg-brand-500/15 text-brand-400">
              <CalendarPlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink-primary">
                {isEditing ? 'Edit Calendar Event' : 'Add Calendar Event'}
              </h2>
              <p className="text-xs text-ink-muted">
                Schedule campus drives, PPTs, deadlines, or workshops
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
            <label htmlFor="title" className="block text-xs font-medium text-ink-secondary">
              Event title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="HCL - Software Developer Recruitment Drive"
              value={form.title}
              onChange={handleChange}
              className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="event_type" className="block text-xs font-medium text-ink-secondary">
                Event type
              </label>
              <select
                id="event_type"
                name="event_type"
                value={form.event_type}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {EVENT_TYPES.map((et) => (
                  <option key={et.value} value={et.value} className="bg-surface-card text-ink-primary">
                    {et.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="status" className="block text-xs font-medium text-ink-secondary">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st} className="bg-surface-card text-ink-primary">
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="start_datetime"
                className="block text-xs font-medium text-ink-secondary"
              >
                Start date & time
              </label>
              <input
                id="start_datetime"
                name="start_datetime"
                type="datetime-local"
                required
                value={form.start_datetime}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-xs text-ink-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="end_datetime"
                className="block text-xs font-medium text-ink-secondary"
              >
                End date & time
              </label>
              <input
                id="end_datetime"
                name="end_datetime"
                type="datetime-local"
                required
                value={form.end_datetime}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-xs text-ink-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="location" className="block text-xs font-medium text-ink-secondary">
                Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                placeholder="Pune / CSE Seminar Hall"
                value={form.location}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="drive" className="block text-xs font-medium text-ink-secondary">
                Linked Drive ID (Optional)
              </label>
              <input
                id="drive"
                name="drive"
                type="number"
                min="1"
                placeholder="6"
                value={form.drive}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="meeting_link" className="block text-xs font-medium text-ink-secondary">
              Meeting link (Optional)
            </label>
            <input
              id="meeting_link"
              name="meeting_link"
              type="url"
              placeholder="https://meet.google.com/..."
              value={form.meeting_link}
              onChange={handleChange}
              className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-xs font-medium text-ink-secondary">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              placeholder="Details about the event..."
              value={form.description}
              onChange={handleChange}
              className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
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
              className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-brand-glow transition hover:bg-brand-600 disabled:opacity-60 cursor-pointer"
            >
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Event'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}