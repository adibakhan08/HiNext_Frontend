import { useEffect, useState } from 'react';
import { X, ShieldCheck, CheckCircle2, GraduationCap, Building } from 'lucide-react';
import { axiosClient } from '../../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../../api/endpoints';

const INITIAL_FORM = {
  minimum_cgpa: '7.0',
  maximum_backlogs: '0',
  graduation_year: '2027',
  eligible_departments: [],
  eligible_courses: [],
};

export function DriveEligibilityModal({ isOpen, onClose, drive, onSaved }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    Promise.allSettled([
      axiosClient.get(API_ENDPOINTS.ACADEMICS.DEPARTMENTS),
      axiosClient.get(API_ENDPOINTS.ACADEMICS.COURSES),
    ]).then(([deptRes, courseRes]) => {
      if (deptRes.status === 'fulfilled') {
        const d = deptRes.value.data;
        setDepartments(Array.isArray(d) ? d : d.results || []);
      }
      if (courseRes.status === 'fulfilled') {
        const c = courseRes.value.data;
        setCourses(Array.isArray(c) ? c : c.results || []);
      }
    });
  }, [isOpen]);

  useEffect(() => {
    const existing = drive?.eligibility;
    if (existing && typeof existing === 'object') {
      setForm({
        minimum_cgpa: String(existing.minimum_cgpa ?? existing.min_cgpa ?? '7.0'),
        maximum_backlogs: String(existing.maximum_backlogs ?? existing.max_backlogs ?? '0'),
        graduation_year: String(existing.graduation_year ?? '2027'),
        eligible_departments: Array.isArray(existing.eligible_departments)
          ? existing.eligible_departments.map(Number)
          : [],
        eligible_courses: Array.isArray(existing.eligible_courses)
          ? existing.eligible_courses.map(Number)
          : [],
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setError(null);
    setSuccessMsg(null);
  }, [drive, isOpen]);

  if (!isOpen || !drive?.id) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const toggleIdInList = (field, id) => {
    const numId = Number(id);
    setForm((prev) => {
      const exists = prev[field].includes(numId);
      return {
        ...prev,
        [field]: exists
          ? prev[field].filter((item) => item !== numId)
          : [...prev[field], numId],
      };
    });
    setError(null);
  };

  const handleSelectAll = (field, items) => {
    const allIds = items.map((item) => Number(item.id));
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].length === allIds.length ? [] : allIds,
    }));
  };

  const handleFillSample = () => {
    setForm({
      minimum_cgpa: '7.0',
      maximum_backlogs: '0',
      graduation_year: '2027',
      eligible_departments:
        departments.length > 0
          ? departments.slice(0, 3).map((d) => Number(d.id))
          : [1, 2, 3],
      eligible_courses:
        courses.length > 0
          ? courses.slice(0, 2).map((c) => Number(c.id))
          : [1, 2],
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    const payload = {
      minimum_cgpa: parseFloat(form.minimum_cgpa) || 0,
      maximum_backlogs: Number(form.maximum_backlogs) || 0,
      graduation_year: Number(form.graduation_year),
      eligible_departments: form.eligible_departments.map(Number),
      eligible_courses: form.eligible_courses.map(Number),
    };

    try {
      const { data } = await axiosClient.post(
        API_ENDPOINTS.ADMIN.DRIVE_ELIGIBILITY(drive.id),
        payload
      );

      setSuccessMsg('Eligibility criteria saved for this drive!');
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
            'Failed to save eligibility criteria.'
        );
      } else {
        setError('Network error while saving eligibility criteria.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/15 text-accent-emerald">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-ink-primary">
                  Add Drive Eligibility
                </h2>
                <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] font-semibold text-brand-400">
                  Step 2 of 2
                </span>
              </div>
              <p className="text-xs text-ink-muted">
                {drive.title || `Drive #${drive.id}`} · Set CGPA, backlogs &amp; eligible branches
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

        {/* Sample Payload Quick Fill */}
        <div className="mt-4 flex items-center justify-between rounded-xl border border-brand-500/20 bg-brand-900/20 px-3.5 py-2.5 text-xs">
          <span className="text-ink-secondary">
            Fill sample eligibility (<span className="text-brand-400">7.0 CGPA · 0 Backlogs · 2027</span>)
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
          {/* Row 1: Min CGPA, Max Backlogs & Graduation Year */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label
                htmlFor="minimum_cgpa"
                className="block text-xs font-medium text-ink-secondary"
              >
                Minimum CGPA
              </label>
              <input
                id="minimum_cgpa"
                name="minimum_cgpa"
                type="number"
                step="0.01"
                min="0"
                max="10"
                required
                placeholder="7.0"
                value={form.minimum_cgpa}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="maximum_backlogs"
                className="block text-xs font-medium text-ink-secondary"
              >
                Maximum Backlogs
              </label>
              <input
                id="maximum_backlogs"
                name="maximum_backlogs"
                type="number"
                min="0"
                required
                placeholder="0"
                value={form.maximum_backlogs}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="graduation_year"
                className="block text-xs font-medium text-ink-secondary"
              >
                Graduation Year
              </label>
              <input
                id="graduation_year"
                name="graduation_year"
                type="number"
                min="2020"
                max="2035"
                required
                placeholder="2027"
                value={form.graduation_year}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Row 2: Eligible Departments Multi-Select */}
          <div className="space-y-2 rounded-xl border border-border-subtle bg-surface-input/40 p-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
                <Building className="h-3.5 w-3.5 text-brand-400" />
                Eligible Departments
              </span>
              {departments.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleSelectAll('eligible_departments', departments)}
                  className="text-[11px] font-medium text-brand-400 hover:underline cursor-pointer"
                >
                  {form.eligible_departments.length === departments.length
                    ? 'Clear all'
                    : 'Select all'}
                </button>
              )}
            </div>

            {departments.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {departments.map((dept) => {
                  const selected = form.eligible_departments.includes(Number(dept.id));
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => toggleIdInList('eligible_departments', dept.id)}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                        selected
                          ? 'border-brand-500 bg-brand-500/20 text-brand-300'
                          : 'border-border-subtle bg-surface-input text-ink-secondary hover:text-ink-primary'
                      }`}
                    >
                      {dept.code || dept.name} (#{dept.id})
                    </button>
                  );
                })}
              </div>
            ) : (
              <input
                type="text"
                placeholder="Enter department IDs comma-separated (e.g. 1, 2, 3)"
                value={form.eligible_departments.join(', ')}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    eligible_departments: e.target.value
                      .split(',')
                      .map((s) => Number(s.trim()))
                      .filter((n) => !Number.isNaN(n) && n > 0),
                  }))
                }
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-xs text-ink-primary"
              />
            )}
          </div>

          {/* Row 3: Eligible Courses Multi-Select */}
          <div className="space-y-2 rounded-xl border border-border-subtle bg-surface-input/40 p-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
                <GraduationCap className="h-3.5 w-3.5 text-accent-emerald" />
                Eligible Courses
              </span>
              {courses.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleSelectAll('eligible_courses', courses)}
                  className="text-[11px] font-medium text-brand-400 hover:underline cursor-pointer"
                >
                  {form.eligible_courses.length === courses.length
                    ? 'Clear all'
                    : 'Select all'}
                </button>
              )}
            </div>

            {courses.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {courses.map((course) => {
                  const selected = form.eligible_courses.includes(Number(course.id));
                  return (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => toggleIdInList('eligible_courses', course.id)}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                        selected
                          ? 'border-emerald-500/50 bg-emerald-500/15 text-accent-emerald'
                          : 'border-border-subtle bg-surface-input text-ink-secondary hover:text-ink-primary'
                      }`}
                    >
                      {course.name} (#{course.id})
                    </button>
                  );
                })}
              </div>
            ) : (
              <input
                type="text"
                placeholder="Enter course IDs comma-separated (e.g. 1, 2)"
                value={form.eligible_courses.join(', ')}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    eligible_courses: e.target.value
                      .split(',')
                      .map((s) => Number(s.trim()))
                      .filter((n) => !Number.isNaN(n) && n > 0),
                  }))
                }
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-xs text-ink-primary"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-border-subtle pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border-subtle bg-surface-input px-4 py-2 text-xs font-medium text-ink-secondary transition hover:bg-surface-elevated hover:text-ink-primary cursor-pointer"
            >
              Skip for now
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-brand-glow transition hover:bg-brand-600 disabled:opacity-60 cursor-pointer"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Saving Eligibility...' : 'Save Eligibility'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}