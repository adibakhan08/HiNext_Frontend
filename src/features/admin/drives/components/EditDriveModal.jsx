import { useEffect, useState } from 'react';
import {
  X,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  Building,
  GraduationCap,
} from 'lucide-react';
import { axiosClient } from '../../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../../api/endpoints';

const JOB_TYPES = ['FULL_TIME', 'INTERNSHIP', 'INTERN_PLUS_FTE', 'CONTRACT'];
const STATUS_OPTIONS = ['OPEN', 'UPCOMING', 'ONGOING', 'CLOSED', 'COMPLETED'];

function toDateTimeLocal(isoStr) {
  if (!isoStr) return '';
  return isoStr.slice(0, 16);
}

function toIsoUtc(localStr) {
  if (!localStr) return null;
  if (localStr.endsWith('Z')) return localStr;
  return localStr.length === 16 ? `${localStr}:00Z` : new Date(localStr).toISOString();
}

export function EditDriveModal({ isOpen, onClose, drive, initialTab = 'DETAILS', onSaved }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'DETAILS' | 'ELIGIBILITY'

  // Reference lists
  const [companies, setCompanies] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);

  // Tab 1: Drive Details form
  const [detailsForm, setDetailsForm] = useState({
    company: '',
    academic_session: '1',
    title: '',
    job_role: '',
    job_description: '',
    job_type: 'FULL_TIME',
    package_min: '',
    package_max: '',
    location: '',
    openings: '1',
    application_start_date: '',
    application_deadline: '',
    drive_date: '',
    status: 'OPEN',
  });

  // Tab 2: Eligibility form
  const [eligibilityForm, setEligibilityForm] = useState({
    minimum_cgpa: '7.0',
    maximum_backlogs: '0',
    graduation_year: '2027',
    eligible_departments: [],
    eligible_courses: [],
  });

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const populateFromDrive = (d) => {
    if (!d) return;
    setDetailsForm({
      company: String(d.company?.id ?? d.company ?? ''),
      academic_session: String(d.academic_session?.id ?? d.academic_session ?? '1'),
      title: d.title || '',
      job_role: d.job_role || '',
      job_description: d.job_description || '',
      job_type: d.job_type || 'FULL_TIME',
      package_min: d.package_min ?? '',
      package_max: d.package_max ?? '',
      location: d.location || '',
      openings: String(d.openings ?? '1'),
      application_start_date: toDateTimeLocal(d.application_start_date),
      application_deadline: toDateTimeLocal(d.application_deadline),
      drive_date: toDateTimeLocal(d.drive_date),
      status: d.status || 'OPEN',
    });

    const elig = d.eligibility;
    if (elig && typeof elig === 'object') {
      setEligibilityForm({
        minimum_cgpa: String(elig.minimum_cgpa ?? elig.min_cgpa ?? '7.0'),
        maximum_backlogs: String(elig.maximum_backlogs ?? elig.max_backlogs ?? '0'),
        graduation_year: String(elig.graduation_year ?? '2027'),
        eligible_departments: Array.isArray(elig.eligible_departments)
          ? elig.eligible_departments.map(Number)
          : [],
        eligible_courses: Array.isArray(elig.eligible_courses)
          ? elig.eligible_courses.map(Number)
          : [],
      });
    } else {
      setEligibilityForm({
        minimum_cgpa: '7.0',
        maximum_backlogs: '0',
        graduation_year: '2027',
        eligible_departments: [],
        eligible_courses: [],
      });
    }
  };

  useEffect(() => {
    if (!isOpen || !drive?.id) return;

    setActiveTab(initialTab);
    setError(null);
    setSuccessMsg(null);
    populateFromDrive(drive);

    let isMounted = true;
    setIsLoadingData(true);

    Promise.allSettled([
      axiosClient.get(API_ENDPOINTS.STUDENT.DRIVE_DETAIL(drive.id)),
      axiosClient.get(API_ENDPOINTS.ADMIN.COMPANIES),
      axiosClient.get(API_ENDPOINTS.ACADEMICS.SESSIONS),
      axiosClient.get(API_ENDPOINTS.ACADEMICS.DEPARTMENTS),
      axiosClient.get(API_ENDPOINTS.ACADEMICS.COURSES),
    ])
      .then(([detailRes, compRes, sessRes, deptRes, courseRes]) => {
        if (!isMounted) return;

        if (detailRes.status === 'fulfilled' && detailRes.value.data) {
          populateFromDrive(detailRes.value.data);
        }
        if (compRes.status === 'fulfilled') {
          const d = compRes.value.data;
          setCompanies(Array.isArray(d) ? d : d.results || []);
        }
        if (sessRes.status === 'fulfilled') {
          const d = sessRes.value.data;
          setSessions(Array.isArray(d) ? d : d.results || []);
        }
        if (deptRes.status === 'fulfilled') {
          const d = deptRes.value.data;
          setDepartments(Array.isArray(d) ? d : d.results || []);
        }
        if (courseRes.status === 'fulfilled') {
          const d = courseRes.value.data;
          setCourses(Array.isArray(d) ? d : d.results || []);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingData(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, drive, initialTab]);

  if (!isOpen || !drive?.id) return null;

  const handleDetailsChange = (e) => {
    const { name, value } = e.target;
    setDetailsForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccessMsg(null);
  };

  const handleEligibilityChange = (e) => {
    const { name, value } = e.target;
    setEligibilityForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccessMsg(null);
  };

  const toggleIdInList = (field, id) => {
    const numId = Number(id);
    setEligibilityForm((prev) => {
      const exists = prev[field].includes(numId);
      return {
        ...prev,
        [field]: exists
          ? prev[field].filter((item) => item !== numId)
          : [...prev[field], numId],
      };
    });
    setError(null);
    setSuccessMsg(null);
  };

  const handleSelectAll = (field, items) => {
    const allIds = items.map((item) => Number(item.id));
    setEligibilityForm((prev) => ({
      ...prev,
      [field]: prev[field].length === allIds.length ? [] : allIds,
    }));
  };

  const formatApiError = (err, fallback) => {
    const resData = err.response?.data;
    if (typeof resData === 'string') return resData;
    if (resData && typeof resData === 'object') {
      const firstKey = Object.keys(resData)[0];
      const firstVal = Array.isArray(resData[firstKey])
        ? resData[firstKey][0]
        : resData[firstKey];
      return resData.detail || resData.message || `${firstKey}: ${firstVal}` || fallback;
    }
    return fallback;
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    const payload = {
      company: Number(detailsForm.company),
      academic_session: Number(detailsForm.academic_session),
      title: detailsForm.title.trim(),
      job_role: detailsForm.job_role.trim(),
      job_description: detailsForm.job_description.trim(),
      job_type: detailsForm.job_type,
      package_min: String(detailsForm.package_min).trim(),
      package_max: String(detailsForm.package_max).trim(),
      location: detailsForm.location.trim(),
      openings: Number(detailsForm.openings),
      application_start_date: toIsoUtc(detailsForm.application_start_date),
      application_deadline: toIsoUtc(detailsForm.application_deadline),
      drive_date: toIsoUtc(detailsForm.drive_date),
      status: detailsForm.status,
    };

    try {
      const { data } = await axiosClient.patch(
        API_ENDPOINTS.ADMIN.DRIVE_DETAIL(drive.id),
        payload
      );
      setSuccessMsg('Drive details updated successfully.');
      onSaved?.(data);
    } catch (err) {
      setError(formatApiError(err, 'Failed to update placement drive.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEligibility = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    const payload = {
      minimum_cgpa: parseFloat(eligibilityForm.minimum_cgpa) || 0,
      maximum_backlogs: Number(eligibilityForm.maximum_backlogs) || 0,
      graduation_year: Number(eligibilityForm.graduation_year),
      eligible_departments: eligibilityForm.eligible_departments.map(Number),
      eligible_courses: eligibilityForm.eligible_courses.map(Number),
    };

    try {
      const { data } = await axiosClient.post(
        API_ENDPOINTS.ADMIN.DRIVE_ELIGIBILITY(drive.id),
        payload
      );
      setSuccessMsg('Eligibility criteria updated successfully.');
      onSaved?.(data);
    } catch (err) {
      setError(formatApiError(err, 'Failed to update eligibility criteria.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-500/25 bg-brand-500/15 text-brand-400">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-ink-primary">
                  Edit Placement Drive
                </h2>
                {isLoadingData && (
                  <span className="text-[11px] text-ink-muted">Syncing...</span>
                )}
              </div>
              <p className="text-xs text-ink-muted">
                {drive.title || `Drive #${drive.id}`}
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

        {/* Modal Navigation Tabs */}
        <div className="mt-4 flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface-input p-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('DETAILS');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'DETAILS'
                ? 'bg-brand-500 text-white shadow-brand-glow'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>Drive Details</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('ELIGIBILITY');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'ELIGIBILITY'
                ? 'bg-brand-500 text-white shadow-brand-glow'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Eligibility Criteria</span>
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

        {/* TAB 1: DRIVE DETAILS */}
        {activeTab === 'DETAILS' && (
          <form onSubmit={handleSaveDetails} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-ink-secondary">
                  Company
                </label>
                {companies.length > 0 ? (
                  <select
                    name="company"
                    required
                    value={detailsForm.company}
                    onChange={handleDetailsChange}
                    className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none"
                  >
                    <option value="">Select company...</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id} className="bg-surface-card">
                        {c.name} (#{c.id})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    name="company"
                    type="number"
                    required
                    value={detailsForm.company}
                    onChange={handleDetailsChange}
                    className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-ink-secondary">
                  Academic Session
                </label>
                {sessions.length > 0 ? (
                  <select
                    name="academic_session"
                    required
                    value={detailsForm.academic_session}
                    onChange={handleDetailsChange}
                    className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none"
                  >
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id} className="bg-surface-card">
                        {s.name} {s.is_active ? '(Active)' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    name="academic_session"
                    type="number"
                    required
                    value={detailsForm.academic_session}
                    onChange={handleDetailsChange}
                    className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-ink-secondary">
                  Status
                </label>
                <select
                  name="status"
                  value={detailsForm.status}
                  onChange={handleDetailsChange}
                  className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st} className="bg-surface-card">
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-ink-secondary">
                  Drive title
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  value={detailsForm.title}
                  onChange={handleDetailsChange}
                  className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-ink-secondary">
                  Job role
                </label>
                <input
                  name="job_role"
                  type="text"
                  required
                  value={detailsForm.job_role}
                  onChange={handleDetailsChange}
                  className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-ink-secondary">
                  Job type
                </label>
                <select
                  name="job_type"
                  value={detailsForm.job_type}
                  onChange={handleDetailsChange}
                  className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none"
                >
                  {JOB_TYPES.map((jt) => (
                    <option key={jt} value={jt} className="bg-surface-card">
                      {jt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-ink-secondary">
                  Location
                </label>
                <input
                  name="location"
                  type="text"
                  required
                  value={detailsForm.location}
                  onChange={handleDetailsChange}
                  className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-ink-secondary">
                  Openings
                </label>
                <input
                  name="openings"
                  type="number"
                  min="1"
                  required
                  value={detailsForm.openings}
                  onChange={handleDetailsChange}
                  className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-ink-secondary">
                  Minimum Package (INR / annum)
                </label>
                <input
                  name="package_min"
                  type="number"
                  min="0"
                  required
                  value={detailsForm.package_min}
                  onChange={handleDetailsChange}
                  className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-ink-secondary">
                  Maximum Package (INR / annum)
                </label>
                <input
                  name="package_max"
                  type="number"
                  min="0"
                  required
                  value={detailsForm.package_max}
                  onChange={handleDetailsChange}
                  className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-ink-secondary">
                  Application start
                </label>
                <input
                  name="application_start_date"
                  type="datetime-local"
                  required
                  value={detailsForm.application_start_date}
                  onChange={handleDetailsChange}
                  className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-xs text-ink-primary focus:border-border-focus focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-ink-secondary">
                  Application deadline
                </label>
                <input
                  name="application_deadline"
                  type="datetime-local"
                  required
                  value={detailsForm.application_deadline}
                  onChange={handleDetailsChange}
                  className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-xs text-ink-primary focus:border-border-focus focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-ink-secondary">
                  Drive date &amp; time
                </label>
                <input
                  name="drive_date"
                  type="datetime-local"
                  required
                  value={detailsForm.drive_date}
                  onChange={handleDetailsChange}
                  className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-xs text-ink-primary focus:border-border-focus focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-ink-secondary">
                Job description
              </label>
              <textarea
                name="job_description"
                rows={3}
                required
                value={detailsForm.job_description}
                onChange={handleDetailsChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border-subtle pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border-subtle bg-surface-input px-4 py-2 text-xs font-medium text-ink-secondary transition hover:bg-surface-elevated hover:text-ink-primary cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-brand-glow transition hover:bg-brand-600 disabled:opacity-60 cursor-pointer"
              >
                <Briefcase className="h-3.5 w-3.5" />
                <span>{isSubmitting ? 'Saving...' : 'Save Drive Details'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: ELIGIBILITY CRITERIA */}
        {activeTab === 'ELIGIBILITY' && (
          <form onSubmit={handleSaveEligibility} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-ink-secondary">
                  Minimum CGPA
                </label>
                <input
                  name="minimum_cgpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  required
                  value={eligibilityForm.minimum_cgpa}
                  onChange={handleEligibilityChange}
                  className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-ink-secondary">
                  Maximum Backlogs
                </label>
                <input
                  name="maximum_backlogs"
                  type="number"
                  min="0"
                  required
                  value={eligibilityForm.maximum_backlogs}
                  onChange={handleEligibilityChange}
                  className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-ink-secondary">
                  Graduation Year
                </label>
                <input
                  name="graduation_year"
                  type="number"
                  min="2020"
                  max="2035"
                  required
                  value={eligibilityForm.graduation_year}
                  onChange={handleEligibilityChange}
                  className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none"
                />
              </div>
            </div>

            {/* Eligible Departments */}
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
                    {eligibilityForm.eligible_departments.length === departments.length
                      ? 'Clear all'
                      : 'Select all'}
                  </button>
                )}
              </div>

              {departments.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {departments.map((dept) => {
                    const selected = eligibilityForm.eligible_departments.includes(
                      Number(dept.id)
                    );
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
                  value={eligibilityForm.eligible_departments.join(', ')}
                  onChange={(e) =>
                    setEligibilityForm((prev) => ({
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

            {/* Eligible Courses */}
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
                    {eligibilityForm.eligible_courses.length === courses.length
                      ? 'Clear all'
                      : 'Select all'}
                  </button>
                )}
              </div>

              {courses.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {courses.map((course) => {
                    const selected = eligibilityForm.eligible_courses.includes(
                      Number(course.id)
                    );
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
                  value={eligibilityForm.eligible_courses.join(', ')}
                  onChange={(e) =>
                    setEligibilityForm((prev) => ({
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

            <div className="flex items-center justify-end gap-3 border-t border-border-subtle pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border-subtle bg-surface-input px-4 py-2 text-xs font-medium text-ink-secondary transition hover:bg-surface-elevated hover:text-ink-primary cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-brand-glow transition hover:bg-brand-600 disabled:opacity-60 cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{isSubmitting ? 'Saving...' : 'Save Eligibility'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}