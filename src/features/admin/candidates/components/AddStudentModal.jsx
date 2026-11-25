import { useState } from 'react';
import { X, UserPlus, CheckCircle2 } from 'lucide-react';
import { axiosClient } from '../../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../../api/endpoints';

const INITIAL_FORM = {
  username: '',
  email: '',
  password: '',
  confirm_password: '',
  first_name: '',
  last_name: '',
  phone: '',
};

export function AddStudentModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleFillSample = () => {
    setForm({
      username: 'student01',
      email: 'student@gmail.com',
      password: 'Student@123',
      confirm_password: 'Student@123',
      first_name: 'Rahul',
      last_name: 'Patil',
      phone: '9876543210',
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (form.password !== form.confirm_password) {
      setError('Password and confirm password do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await axiosClient.post(
        API_ENDPOINTS.AUTH.ADMIN_CREATE_STUDENT,
        form
      );
      setSuccessMsg(data.message || 'Student account created successfully.');
      setForm(INITIAL_FORM);
      onCreated?.(data);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 900);
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
            'Failed to create student.'
        );
      } else {
        setError('Network error while creating student account.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-500/25 bg-brand-500/15 text-brand-400">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink-primary">Add Student</h2>
              <p className="text-xs text-ink-muted">
                Create a new candidate account in the placement portal
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

        {/* Sample Payload Helper */}
        <div className="mt-4 flex items-center justify-between rounded-xl border border-brand-500/20 bg-brand-900/20 px-3.5 py-2.5 text-xs">
          <span className="text-ink-secondary">
            Need test data? Fill sample candidate (<span className="text-brand-400">Rahul Patil</span>)
          </span>
          <button
            type="button"
            onClick={handleFillSample}
            className="font-medium text-brand-400 hover:underline cursor-pointer"
          >
            Fill sample
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
              <label htmlFor="first_name" className="block text-xs font-medium text-ink-secondary">
                First name
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                placeholder="Rahul"
                value={form.first_name}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="last_name" className="block text-xs font-medium text-ink-secondary">
                Last name
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                required
                placeholder="Patil"
                value={form.last_name}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-xs font-medium text-ink-secondary">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                placeholder="student01"
                value={form.username}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="block text-xs font-medium text-ink-secondary">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="9876543210"
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-medium text-ink-secondary">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="student@gmail.com"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-medium text-ink-secondary">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Student@123"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="confirm_password"
                className="block text-xs font-medium text-ink-secondary"
              >
                Confirm password
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                required
                placeholder="Student@123"
                value={form.confirm_password}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Actions */}
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
              <UserPlus className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Creating...' : 'Create Student'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}