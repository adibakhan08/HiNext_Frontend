import { useEffect, useState } from 'react';
import { X, Award, CheckCircle2 } from 'lucide-react';
import { axiosClient } from '../../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../../api/endpoints';

const STATUS_CHOICES = ['COMPLETED', 'NO_SHOW', 'CANCELLED', 'RESCHEDULED'];
const RESULT_CHOICES = ['PASSED', 'FAILED', 'HOLD', 'PENDING'];

export function SubmitResultModal({ interview, onClose, onSubmitted }) {
  const [form, setForm] = useState({
    status: 'COMPLETED',
    result: 'PASSED',
    score: '85.00',
    feedback: '',
    remarks: '',
  });
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (interview) {
      setForm({
        status:
          interview.status && interview.status !== 'SCHEDULED'
            ? interview.status
            : 'COMPLETED',
        result: interview.result || 'PASSED',
        score: interview.score != null ? String(interview.score) : '85.00',
        feedback: interview.feedback || '',
        remarks: interview.remarks || '',
      });
      setError(null);
      setSuccessMsg(null);
    }
  }, [interview]);

  if (!interview?.id) return null;

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
      status: form.status,
      result: form.result,
      score: String(form.score).trim(),
      feedback: form.feedback.trim(),
      remarks: form.remarks.trim(),
    };

    try {
      const { data } = await axiosClient.post(
        API_ENDPOINTS.ADMIN.INTERVIEW_RESULT(interview.id),
        payload
      );
      setSuccessMsg('Interview result submitted.');
      onSubmitted?.({ ...interview, ...data, ...payload });
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
            'Failed to submit interview result.'
        );
      } else {
        setError('Network error while submitting interview result.');
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/15 text-accent-emerald">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink-primary">
                Submit Interview Result
              </h2>
              <p className="text-xs text-ink-muted">
                Interview #{interview.id} ·{' '}
                {interview.candidate_name || `Candidate #${interview.candidate || ''}`}
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label htmlFor="res_status" className="block text-xs font-medium text-ink-secondary">
                Status
              </label>
              <select
                id="res_status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none"
              >
                {STATUS_CHOICES.map((st) => (
                  <option key={st} value={st} className="bg-surface-card">
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="res_result" className="block text-xs font-medium text-ink-secondary">
                Result
              </label>
              <select
                id="res_result"
                name="result"
                value={form.result}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none"
              >
                {RESULT_CHOICES.map((rc) => (
                  <option key={rc} value={rc} className="bg-surface-card">
                    {rc}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="res_score" className="block text-xs font-medium text-ink-secondary">
                Score
              </label>
              <input
                id="res_score"
                name="score"
                type="text"
                required
                placeholder="85.00"
                value={form.score}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="res_feedback" className="block text-xs font-medium text-ink-secondary">
              Feedback
            </label>
            <textarea
              id="res_feedback"
              name="feedback"
              rows={2}
              placeholder="Good technical knowledge."
              value={form.feedback}
              onChange={handleChange}
              className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="res_remarks" className="block text-xs font-medium text-ink-secondary">
              Remarks
            </label>
            <input
              id="res_remarks"
              name="remarks"
              type="text"
              placeholder="Recommended for the next round."
              value={form.remarks}
              onChange={handleChange}
              className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none"
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
              className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-brand-glow transition hover:bg-brand-600 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Result'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}