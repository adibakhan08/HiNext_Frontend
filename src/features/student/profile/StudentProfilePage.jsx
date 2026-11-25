import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  UserCircle,
  GraduationCap,
  Link as LinkIcon,
  Camera,
  Save,
  CheckCircle2,
  FileText,
  Upload,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { axiosClient } from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import { Topbar } from '../../../components/layout/Topbar';

const INITIAL_FORM = {
  enrollment_number: '',
  date_of_birth: '',
  gender: '',
  department: '',
  course: '',
  graduation_year: '',
  current_cgpa: '',
  backlogs: '0',
  address: '',
  linkedin_url: '',
  github_url: '',
  portfolio_url: '',
};

const GENDER_OPTIONS = [
  { value: '', label: 'Select gender...' },
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

function extractResumeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (data && (data.resume_file || data.file || data.url)) return [data];
  return [];
}

function getResumeFileUrl(res) {
  if (typeof res === 'string') return res;
  return res?.resume_file || res?.file || res?.url || '';
}

export function StudentProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);

  // Resume state
  const [resumes, setResumes] = useState([]);
  const [resumeTitle, setResumeTitle] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [isPrimaryResume, setIsPrimaryResume] = useState(true);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [profRes, deptRes, courseRes, resumeRes] = await Promise.allSettled([
      axiosClient.get(API_ENDPOINTS.STUDENT.PROFILE),
      axiosClient.get(API_ENDPOINTS.ACADEMICS.DEPARTMENTS),
      axiosClient.get(API_ENDPOINTS.ACADEMICS.COURSES),
      axiosClient.get(API_ENDPOINTS.STUDENT.RESUME),
    ]);

    if (profRes.status === 'fulfilled') {
      const p = profRes.value.data;
      setProfile(p);
      setPhotoPreview(p.profile_photo || null);
      setForm({
        enrollment_number: p.enrollment_number || '',
        date_of_birth: p.date_of_birth ? p.date_of_birth.slice(0, 10) : '',
        gender: p.gender || '',
        department: p.department ? String(p.department) : '',
        course: p.course ? String(p.course) : '',
        graduation_year: p.graduation_year ? String(p.graduation_year) : '',
        current_cgpa: p.current_cgpa ?? '',
        backlogs: String(p.backlogs ?? 0),
        address: p.address || '',
        linkedin_url: p.linkedin_url || '',
        github_url: p.github_url || '',
        portfolio_url: p.portfolio_url || '',
      });
    } else {
      setError(
        profRes.reason?.response?.data?.detail ||
          'Unable to load student profile.'
      );
    }

    if (deptRes.status === 'fulfilled') {
      const d = deptRes.value.data;
      setDepartments(Array.isArray(d) ? d : d.results || []);
    }

    if (courseRes.status === 'fulfilled') {
      const c = courseRes.value.data;
      setCourses(Array.isArray(c) ? c : c.results || []);
    }

    if (resumeRes.status === 'fulfilled') {
      setResumes(extractResumeList(resumeRes.value.data));
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccessMsg(null);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const completeness = useMemo(() => {
    const checks = [
      Boolean(form.enrollment_number),
      Boolean(form.date_of_birth),
      Boolean(form.gender),
      Boolean(form.department),
      Boolean(form.course),
      Boolean(form.graduation_year),
      Boolean(form.current_cgpa),
      Boolean(form.address),
      Boolean(form.linkedin_url || form.github_url),
      resumes.length > 0,
    ];
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }, [form, resumes.length]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('enrollment_number', form.enrollment_number.trim());
    if (form.date_of_birth) {
      formData.append('date_of_birth', form.date_of_birth);
    }
    formData.append('gender', form.gender);
    if (form.department) {
      formData.append('department', Number(form.department));
    }
    if (form.course) {
      formData.append('course', Number(form.course));
    }
    if (form.graduation_year) {
      formData.append('graduation_year', Number(form.graduation_year));
    }
    if (form.current_cgpa !== '') {
      formData.append('current_cgpa', String(form.current_cgpa).trim());
    }
    formData.append('backlogs', Number(form.backlogs) || 0);
    formData.append('address', form.address.trim());
    formData.append('linkedin_url', form.linkedin_url.trim());
    formData.append('github_url', form.github_url.trim());
    formData.append('portfolio_url', form.portfolio_url.trim());

    if (photoFile) {
      formData.append('profile_photo', photoFile);
    }

    try {
      const { data } = await axiosClient.patch(
        API_ENDPOINTS.STUDENT.PROFILE,
        formData
      );
      setProfile(data);
      setPhotoFile(null);
      if (data.profile_photo) {
        setPhotoPreview(data.profile_photo);
      }
      setSuccessMsg('Profile updated successfully.');
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
            'Failed to update profile.'
        );
      } else {
        setError('Network error while updating profile.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadResume = async (e) => {
    e.preventDefault();
    const trimmedTitle = resumeTitle.trim();
    if (!resumeFile || !trimmedTitle) return;

    setIsUploadingResume(true);
    setError(null);
    setSuccessMsg(null);

    const fd = new FormData();
    fd.append('title', trimmedTitle);
    fd.append('resume_file', resumeFile);
    fd.append('is_primary', isPrimaryResume ? 'true' : 'false');

    try {
      await axiosClient.post(API_ENDPOINTS.STUDENT.RESUME, fd);
      setResumeFile(null);
      setResumeTitle('');
      setIsPrimaryResume(true);
      setSuccessMsg('Resume uploaded successfully.');

      const { data } = await axiosClient.get(API_ENDPOINTS.STUDENT.RESUME);
      setResumes(extractResumeList(data));
    } catch (err) {
      const resData = err.response?.data;
      setError(
        resData?.detail ||
          resData?.resume_file?.[0] ||
          resData?.title?.[0] ||
          resData?.file?.[0] ||
          'Failed to upload resume.'
      );
    } finally {
      setIsUploadingResume(false);
    }
  };

  const filteredCourses = useMemo(() => {
    if (!form.department) return courses;
    const matched = courses.filter(
      (c) => String(c.department?.id ?? c.department ?? '') === String(form.department)
    );
    return matched.length > 0 ? matched : courses;
  }, [courses, form.department]);

  const usernameDisplay = profile?.user || 'student';

  return (
    <div className="flex flex-1 flex-col">
      <Topbar
        title="Profile & Resume"
        subtitle="Keep your academic credentials, links, and resume updated for campus drives"
      />

      <main className="space-y-6 p-7">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {isLoading ? (
          <div className="rounded-xl border border-border-subtle bg-surface-card p-12 text-center text-xs text-ink-muted">
            Loading student profile...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr]">
            {/* Left Column: Avatar Card, Completeness & Resume Upload */}
            <div className="space-y-6">
              {/* Identity & Photo Card */}
              <div className="rounded-xl border border-border-subtle bg-surface-card p-6 text-center">
                <div className="relative mx-auto h-24 w-24">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt={usernameDisplay}
                      className="h-24 w-24 rounded-full object-cover border-2 border-brand-500/50"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-brand-500/40 bg-brand-500/15 text-2xl font-bold text-brand-400">
                      {String(usernameDisplay).charAt(0).toUpperCase()}
                    </div>
                  )}

                  <label
                    htmlFor="profile_photo"
                    title="Upload profile photo"
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white shadow-brand-glow transition hover:bg-brand-600 cursor-pointer"
                  >
                    <Camera className="h-4 w-4" />
                    <input
                      id="profile_photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <h2 className="mt-4 text-base font-bold text-ink-primary">
                  @{usernameDisplay}
                </h2>
                <p className="mt-0.5 font-mono text-xs text-ink-muted">
                  {form.enrollment_number || 'Enrollment not set'}
                </p>

                {/* Quick Metric Strip */}
                <div className="mt-5 grid grid-cols-3 divide-x divide-border-subtle rounded-xl border border-border-subtle bg-surface-input/60 py-3 text-center">
                  <div>
                    <p className="text-[11px] text-ink-muted">CGPA</p>
                    <p className="mt-0.5 text-sm font-bold text-ink-primary">
                      {form.current_cgpa || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-ink-muted">Backlogs</p>
                    <p className="mt-0.5 text-sm font-bold text-ink-primary">
                      {form.backlogs || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-ink-muted">Batch</p>
                    <p className="mt-0.5 text-sm font-bold text-ink-primary">
                      {form.graduation_year || '—'}
                    </p>
                  </div>
                </div>

                {/* Profile Readiness Bar */}
                <div className="mt-5 text-left">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-ink-secondary">
                      Profile Readiness
                    </span>
                    <span className="font-bold text-brand-400">
                      {completeness}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-input">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all duration-300"
                      style={{ width: `${completeness}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Resume Upload Card */}
              <div className="rounded-xl border border-border-subtle bg-surface-card p-5 space-y-4">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-brand-400" />
                  <h3 className="text-sm font-semibold text-ink-primary">
                    Resume / CV
                  </h3>
                </div>

                {resumes.length > 0 && (
                  <div className="space-y-2">
                    {resumes.map((res, idx) => {
                      const fileUrl = getResumeFileUrl(res);
                      return (
                        <div
                          key={res.id || idx}
                          className="flex items-center justify-between gap-2 rounded-lg border border-border-subtle bg-surface-input/70 px-3 py-2.5 text-xs"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="truncate font-medium text-ink-primary">
                              {res.title || `Resume #${idx + 1}`}
                            </span>
                            {res.is_primary && (
                              <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-accent-emerald">
                                Primary
                              </span>
                            )}
                          </div>
                          {fileUrl && (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-brand-400 hover:underline shrink-0"
                            >
                              View <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <form onSubmit={handleUploadResume} className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Resume title (e.g. Software Engineer Resume)"
                    value={resumeTitle}
                    onChange={(e) => setResumeTitle(e.target.value)}
                    className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-xs text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none"
                  />

                  <label className="flex items-center justify-between rounded-lg border border-dashed border-border-subtle bg-surface-input/50 px-3 py-2.5 text-xs text-ink-secondary transition hover:border-brand-500/40 cursor-pointer">
                    <span className="truncate">
                      {resumeFile ? resumeFile.name : 'Choose resume file (PDF, DOC, DOCX)...'}
                    </span>
                    <Upload className="h-3.5 w-3.5 shrink-0 text-brand-400" />
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>

                  <label className="flex items-center gap-2 text-xs text-ink-secondary cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPrimaryResume}
                      onChange={(e) => setIsPrimaryResume(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-border-subtle accent-brand-500"
                    />
                    <span>Set as primary resume</span>
                  </label>

                  <button
                    type="submit"
                    disabled={!resumeFile || !resumeTitle.trim() || isUploadingResume}
                    className="w-full rounded-lg border border-brand-500/40 bg-brand-500/15 py-2 text-xs font-semibold text-brand-400 transition hover:bg-brand-500/25 disabled:opacity-50 cursor-pointer"
                  >
                    {isUploadingResume ? 'Uploading...' : 'Upload Resume'}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Editable Profile Form */}
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Section 1: Personal & Identity */}
              <section className="rounded-xl border border-border-subtle bg-surface-card p-6 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
                  <UserCircle className="h-4 w-4 text-brand-400" />
                  <h3 className="text-sm font-semibold text-ink-primary">
                    Personal Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="enrollment_number"
                      className="block text-xs font-medium text-ink-secondary"
                    >
                      Enrollment Number
                    </label>
                    <input
                      id="enrollment_number"
                      name="enrollment_number"
                      type="text"
                      placeholder="EN2023CS042"
                      value={form.enrollment_number}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="date_of_birth"
                      className="block text-xs font-medium text-ink-secondary"
                    >
                      Date of Birth
                    </label>
                    <input
                      id="date_of_birth"
                      name="date_of_birth"
                      type="date"
                      value={form.date_of_birth}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-xs text-ink-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="gender"
                      className="block text-xs font-medium text-ink-secondary"
                    >
                      Gender
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    >
                      {GENDER_OPTIONS.map((g) => (
                        <option
                          key={g.value}
                          value={g.value}
                          className="bg-surface-card text-ink-primary"
                        >
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="address"
                    className="block text-xs font-medium text-ink-secondary"
                  >
                    Residential Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={2}
                    placeholder="Current city, state, and street address..."
                    value={form.address}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </section>

              {/* Section 2: Academic Credentials */}
              <section className="rounded-xl border border-border-subtle bg-surface-card p-6 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
                  <GraduationCap className="h-4 w-4 text-accent-emerald" />
                  <h3 className="text-sm font-semibold text-ink-primary">
                    Academic Credentials
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="department"
                      className="block text-xs font-medium text-ink-secondary"
                    >
                      Department
                    </label>
                    <select
                      id="department"
                      name="department"
                      value={form.department}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    >
                      <option value="" className="bg-surface-card text-ink-muted">
                        Select department...
                      </option>
                      {departments.map((d) => (
                        <option
                          key={d.id}
                          value={d.id}
                          className="bg-surface-card text-ink-primary"
                        >
                          {d.name} {d.code ? `(${d.code})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="course"
                      className="block text-xs font-medium text-ink-secondary"
                    >
                      Course / Degree
                    </label>
                    <select
                      id="course"
                      name="course"
                      value={form.course}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    >
                      <option value="" className="bg-surface-card text-ink-muted">
                        Select course...
                      </option>
                      {filteredCourses.map((c) => (
                        <option
                          key={c.id}
                          value={c.id}
                          className="bg-surface-card text-ink-primary"
                        >
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                      placeholder="2027"
                      value={form.graduation_year}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="current_cgpa"
                      className="block text-xs font-medium text-ink-secondary"
                    >
                      Current CGPA
                    </label>
                    <input
                      id="current_cgpa"
                      name="current_cgpa"
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      placeholder="8.45"
                      value={form.current_cgpa}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="backlogs"
                      className="block text-xs font-medium text-ink-secondary"
                    >
                      Active Backlogs
                    </label>
                    <input
                      id="backlogs"
                      name="backlogs"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={form.backlogs}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>
              </section>

              {/* Section 3: Portfolio & Coding Profiles */}
              <section className="rounded-xl border border-border-subtle bg-surface-card p-6 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
                  <LinkIcon className="h-4 w-4 text-accent-amber" />
                  <h3 className="text-sm font-semibold text-ink-primary">
                    Social & Portfolio Links
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="linkedin_url"
                      className="block text-xs font-medium text-ink-secondary"
                    >
                      LinkedIn URL
                    </label>
                    <input
                      id="linkedin_url"
                      name="linkedin_url"
                      type="url"
                      placeholder="https://linkedin.com/in/..."
                      value={form.linkedin_url}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="github_url"
                      className="block text-xs font-medium text-ink-secondary"
                    >
                      GitHub URL
                    </label>
                    <input
                      id="github_url"
                      name="github_url"
                      type="url"
                      placeholder="https://github.com/..."
                      value={form.github_url}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="portfolio_url"
                      className="block text-xs font-medium text-ink-secondary"
                    >
                      Portfolio Website
                    </label>
                    <input
                      id="portfolio_url"
                      name="portfolio_url"
                      type="url"
                      placeholder="https://yourportfolio.dev"
                      value={form.portfolio_url}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>
              </section>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-xs font-semibold text-white shadow-brand-glow transition hover:bg-brand-600 disabled:opacity-60 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? 'Saving Profile...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}