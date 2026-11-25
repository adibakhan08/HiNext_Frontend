import { useEffect, useState } from 'react';
import { X, Layers, CheckCircle2 } from 'lucide-react';
import { axiosClient } from '../../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../../api/endpoints';

const ROUND_TYPES = [
  { value: 'TECHNICAL', label: 'Technical' },
  { value: 'HR', label: 'HR / Behavioral' },
  { value: 'MANAGERIAL', label: 'Managerial' },
  { value: 'CODING', label: 'Coding / Machine Test' },
  { value: 'GROUP_DISCUSSION', label: 'Group Discussion' },
  { value: 'APTITUDE', label: 'Aptitude / Screening' },
];

export function CreateRoundModal({
  isOpen,
  onClose,
  driveId,
  nextRoundNumber = 1,
  onCreated,
}) {
  const [form, setForm] = useState({
    drive: driveId ? String(driveId) : '1',
    name: '',
    round_type: 'TECHNICAL',
    round_number: String(nextRoundNumber),
    description: '',
    total_marks: '100',
    is_active: true,
  });
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        drive: driveId ? String(driveId) : '1',
        name: '',
        round_type: 'TECHNICAL',
        round_number: String(nextRoundNumber),
        description: '',
        total_marks: '100',
        is_active: true,
      });
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, driveId, nextRoundNumber]);

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
      drive: Number(form.drive),
      name: form.name.trim(),
      round_type: form.round_type,
      round_number: Number(form.round_number),
      description: form.description.trim(),
      total_marks: Number(form.total_marks),
      is_active: Boolean(form.is_active),
    };

    try {
      const { data } = await axiosClient.post(
        API_ENDPOINTS.ADMIN.INTERVIEW_ROUNDS,
        payload
      );
      setSuccessMsg('Interview round created.');
      onCreated?.(data);
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
            'Failed to create interview round.'
        );
      } else {
        setError('Network error while creating interview round.');
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
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink-primary">
                Create Interview Round
              </h2>
              <p className="text-xs text-ink-muted">
                Configure a round stage, marks, and evaluation details for the drive
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="round_name" className="block text-xs font-medium text-ink-secondary">
                Round Name
              </label>
              <input
                id="round_name"
                name="name"
                type="text"
                required
                placeholder="Technical Interview"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="round_type" className="block text-xs font-medium text-ink-secondary">
                Round Type
              </label>
              <select
                id="round_type"
                name="round_type"
                value={form.round_type}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none"
              >
                {ROUND_TYPES.map((rt) => (
                  <option key={rt.value} value={rt.value} className="bg-surface-card">
                    {rt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label htmlFor="round_drive" className="block text-xs font-medium text-ink-secondary">
                Drive ID
              </label>
              <input
                id="round_drive"
                name="drive"
                type="number"
                min="1"
                required
                value={form.drive}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="round_number" className="block text-xs font-medium text-ink-secondary">
                Round Number
              </label>
              <input
                id="round_number"
                name="round_number"
                type="number"
                min="1"
                required
                value={form.round_number}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="total_marks" className="block text-xs font-medium text-ink-secondary">
                Total Marks
              </label>
              <input
                id="total_marks"
                name="total_marks"
                type="number"
                min="1"
                required
                value={form.total_marks}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="round_desc" className="block text-xs font-medium text-ink-secondary">
              Description
            </label>
            <textarea
              id="round_desc"
              name="description"
              rows={2}
              placeholder="Technical assessment of shortlisted candidates."
              value={form.description}
              onChange={handleChange}
              className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2.5 text-xs font-medium text-ink-secondary cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              className="h-4 w-4 rounded border-border-subtle bg-surface-input text-brand-500 focus:ring-brand-500"
            />
            <span>Active round (available for scheduling interviews)</span>
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
              className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-brand-glow transition hover:bg-brand-600 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? 'Creating...' : 'Create Round'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}