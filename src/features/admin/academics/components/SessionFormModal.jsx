import { useEffect, useState } from 'react';
import { X, CalendarRange, CheckCircle2 } from 'lucide-react';
import { axiosClient } from '../../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../../api/endpoints';

const INITIAL_FORM = {
  name: '',
  start_date: '',
  end_date: '',
  is_active: true,
};

export function SessionFormModal({ isOpen, onClose, session, onSaved }) {
  const isEditing = Boolean(session?.id);
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      setForm({
        name: session.name || '',
        start_date: session.start_date ? session.start_date.slice(0, 10) : '',
        end_date: session.end_date ? session.end_date.slice(0, 10) : '',
        is_active: Boolean(session.is_active),
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setError(null);
    setSuccessMsg(null);
  }, [session, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    const payload = {
      name: form.name.trim(),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      is_active: form.is_active,
    };

    try {
      const { data } = isEditing
        ? await axiosClient.patch(
            API_ENDPOINTS.ACADEMICS.SESSION_DETAIL(session.id),
            payload
          )
        : await axiosClient.post(API_ENDPOINTS.ACADEMICS.SESSIONS, payload);

      setSuccessMsg(
        isEditing
          ? 'Academic session updated.'
          : 'Academic session created.'
      );
      onSaved?.(data);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 700);
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
            'Failed to save academic session.'
        );
      } else {
        setError('Network error while saving academic session.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-500/25 bg-brand-500/15 text-brand-400">
              <CalendarRange className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink-primary">
                {isEditing ? 'Edit Academic Session' : 'New Academic Session'}
              </h2>
              <p className="text-xs text-ink-muted">
                Define placement batch year and active status
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
            <label htmlFor="name" className="block text-xs font-medium text-ink-secondary">
              Session name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="2026-2027"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="start_date" className="block text-xs font-medium text-ink-secondary">
                Start date
              </label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                required
                value={form.start_date}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-xs text-ink-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="end_date" className="block text-xs font-medium text-ink-secondary">
                End date
              </label>
              <input
                id="end_date"
                name="end_date"
                type="date"
                required
                value={form.end_date}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-xs text-ink-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 rounded-xl border border-border-subtle bg-surface-input/60 px-3.5 py-3 text-xs text-ink-secondary cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              className="h-4 w-4 accent-brand-500"
            />
            <span>Set as active placement season</span>
          </label>

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
              <span>
                {isSubmitting
                  ? 'Saving...'
                  : isEditing
                  ? 'Save Changes'
                  : 'Create Session'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}