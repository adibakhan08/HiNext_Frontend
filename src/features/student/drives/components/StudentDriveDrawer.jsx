import { useEffect, useState } from 'react';
import {
  X,
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Send,
  GraduationCap,
  ShieldCheck,
  Award,
  Building,
} from 'lucide-react';
import { axiosClient } from '../../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../../api/endpoints';

function formatPackageRange(minVal, maxVal) {
  const minNum = parseFloat(minVal);
  const maxNum = parseFloat(maxVal);
  if (!minNum && !maxNum) return 'Not disclosed';

  const toLpa = (val) => (val >= 10000 ? `${(val / 100000).toFixed(1)}` : `${val}`);
  if (minNum && maxNum && minNum !== maxNum) {
    return `${toLpa(minNum)} – ${toLpa(maxNum)} LPA`;
  }
  return `${toLpa(maxNum || minNum)} LPA`;
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

export function StudentDriveDrawer({
  drive,
  onClose,
  onApplied,
}) {
  const [driveDetail, setDriveDetail] = useState(drive);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    setDriveDetail(drive);
    setError(null);
    setSuccessMsg(null);

    if (!drive?.id) return;

    let isMounted = true;
    setIsLoadingDetail(true);

    axiosClient
      .get(API_ENDPOINTS.STUDENT.DRIVE_DETAIL(drive.id))
      .then(({ data }) => {
        if (isMounted && data) {
          setDriveDetail(data);
        }
      })
      .catch(() => {
        // Keep passed list item data if detail fetch fails
      })
      .finally(() => {
        if (isMounted) setIsLoadingDetail(false);
      });

    return () => {
      isMounted = false;
    };
  }, [drive]);

  if (!driveDetail) return null;

  const companyName =
    driveDetail.company_name ||
    driveDetail.company?.name ||
    (driveDetail.company ? `Company #${driveDetail.company}` : 'Recruiting Partner');

  const eligibility =
    driveDetail.eligibility && typeof driveDetail.eligibility === 'object'
      ? driveDetail.eligibility
      : null;

  const eligibleDepts = eligibility?.eligible_departments_names || [];
  const eligibleCourses = eligibility?.eligible_courses_names || [];

  const regStatus = String(driveDetail.registration_status || '').toUpperCase();
  const isRegistered =
    (regStatus && regStatus !== 'NOT_REGISTERED' && regStatus !== 'NONE') ||
    Boolean(driveDetail.has_applied) ||
    Boolean(driveDetail.is_registered);

  const isOpenForApply =
    (driveDetail.status === 'OPEN' || driveDetail.status === 'ONGOING') && !isRegistered;

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsApplying(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const { data } = await axiosClient.post(
        API_ENDPOINTS.STUDENT.DRIVE_REGISTRATIONS,
        {
          drive: Number(driveDetail.id),
        }
      );
      const updatedStatus = data?.status || 'REGISTERED';
      setDriveDetail((prev) => ({
        ...prev,
        registration_status: updatedStatus,
      }));
      setSuccessMsg('Successfully registered for this drive!');
      onApplied?.(driveDetail.id, data);
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
            'Unable to register for this drive.'
        );
      } else {
        setError('Network error while registering for drive.');
      }
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs">
      <div className="flex h-full w-full max-w-xl flex-col border-l border-border-subtle bg-surface-card shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/15 text-sm font-bold text-accent-amber">
              {companyName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-base font-bold text-ink-primary">
                  {driveDetail.title || driveDetail.job_role}
                </h2>
                {isLoadingDetail && (
                  <span className="text-[10px] text-ink-muted">Syncing...</span>
                )}
              </div>
              <p className="truncate text-xs text-ink-muted">
                {companyName} · {driveDetail.job_role}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-elevated hover:text-ink-primary cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/30 p-3.5 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3.5 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Key Highlights */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border-subtle bg-surface-input/70 p-3.5">
              <span className="text-[11px] text-ink-muted">Compensation</span>
              <p className="mt-1 text-sm font-bold text-accent-emerald">
                {formatPackageRange(driveDetail.package_min, driveDetail.package_max)}
              </p>
            </div>

            <div className="rounded-xl border border-border-subtle bg-surface-input/70 p-3.5">
              <span className="text-[11px] text-ink-muted">Openings</span>
              <p className="mt-1 text-sm font-bold text-ink-primary">
                {driveDetail.openings ?? '—'} seats
              </p>
            </div>

            <div className="rounded-xl border border-border-subtle bg-surface-input/70 p-3.5">
              <span className="text-[11px] text-ink-muted">Job Type</span>
              <p className="mt-1 text-xs font-semibold text-ink-primary">
                {(driveDetail.job_type || 'FULL_TIME').replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          {/* Eligibility Criteria Card */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-accent-emerald" />
                <span>Eligibility Criteria</span>
              </h3>
              {eligibility?.graduation_year && (
                <span className="rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-300">
                  Batch {eligibility.graduation_year}
                </span>
              )}
            </div>

            {eligibility ? (
              <div className="space-y-4 rounded-xl border border-border-subtle bg-surface-input/50 p-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border-subtle/80 bg-surface-card/70 px-3 py-2.5">
                    <span className="text-[10px] uppercase tracking-wider text-ink-muted">
                      Min CGPA
                    </span>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm font-bold text-ink-primary">
                      <Award className="h-3.5 w-3.5 text-brand-400" />
                      <span>{eligibility.minimum_cgpa ?? '0.00'}</span>
                    </p>
                  </div>

                  <div className="rounded-lg border border-border-subtle/80 bg-surface-card/70 px-3 py-2.5">
                    <span className="text-[10px] uppercase tracking-wider text-ink-muted">
                      Max Backlogs
                    </span>
                    <p className="mt-0.5 text-sm font-bold text-ink-primary">
                      {eligibility.maximum_backlogs ?? 0}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border-subtle/80 bg-surface-card/70 px-3 py-2.5">
                    <span className="text-[10px] uppercase tracking-wider text-ink-muted">
                      Passing Year
                    </span>
                    <p className="mt-0.5 text-sm font-bold text-ink-primary">
                      {eligibility.graduation_year || '—'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 border-t border-border-subtle/70 pt-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-ink-muted">
                      <Building className="h-3.5 w-3.5 text-brand-400" />
                      Departments:
                    </span>
                    {eligibleDepts.length > 0 ? (
                      eligibleDepts.map((dept, idx) => (
                        <span
                          key={idx}
                          className="rounded-md border border-brand-500/30 bg-brand-500/15 px-2 py-0.5 text-[11px] font-medium text-brand-300"
                        >
                          {dept}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-md border border-border-subtle bg-surface-card px-2 py-0.5 text-[11px] text-ink-secondary">
                        All Departments
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-ink-muted">
                      <GraduationCap className="h-3.5 w-3.5 text-accent-emerald" />
                      Courses:
                    </span>
                    {eligibleCourses.length > 0 ? (
                      eligibleCourses.map((course, idx) => (
                        <span
                          key={idx}
                          className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-accent-emerald"
                        >
                          {course}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-md border border-border-subtle bg-surface-card px-2 py-0.5 text-[11px] text-ink-secondary">
                        All Courses
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 rounded-xl border border-border-subtle bg-surface-input/50 p-4 text-xs text-ink-secondary">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent-emerald" />
                <span>
                  {typeof driveDetail.eligibility === 'string'
                    ? driveDetail.eligibility
                    : 'Open to all eligible students in this academic session.'}
                </span>
              </div>
            )}
          </section>

          {/* Schedule, Session & Location */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Schedule, Session &amp; Location
            </h3>
            <div className="space-y-2.5 rounded-xl border border-border-subtle bg-surface-input/50 p-4 text-xs">
              {driveDetail.academic_session_name && (
                <div className="flex items-center gap-2.5 text-ink-secondary">
                  <GraduationCap className="h-4 w-4 shrink-0 text-indigo-400" />
                  <span>Academic Session: {driveDetail.academic_session_name}</span>
                </div>
              )}

              <div className="flex items-center gap-2.5 text-ink-secondary">
                <MapPin className="h-4 w-4 shrink-0 text-brand-400" />
                <span>Location: {driveDetail.location || 'On-Campus / Hybrid'}</span>
              </div>

              {driveDetail.application_start_date && (
                <div className="flex items-center gap-2.5 text-ink-secondary">
                  <Users className="h-4 w-4 shrink-0 text-sky-400" />
                  <span>
                    Applications Open: {formatDateTime(driveDetail.application_start_date)}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2.5 text-ink-secondary">
                <Clock className="h-4 w-4 shrink-0 text-accent-amber" />
                <span>
                  Application Deadline: {formatDateTime(driveDetail.application_deadline)}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-ink-secondary">
                <Calendar className="h-4 w-4 shrink-0 text-accent-emerald" />
                <span>Drive Date: {formatDateTime(driveDetail.drive_date)}</span>
              </div>
            </div>
          </section>

          {/* Job Description */}
          <section className="space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Role Description
            </h3>
            <div className="rounded-xl border border-border-subtle bg-surface-input/50 p-4 text-xs leading-relaxed text-ink-secondary whitespace-pre-line">
              {driveDetail.job_description ||
                driveDetail.description ||
                'No additional role description provided.'}
            </div>
          </section>

          {/* Registration Section */}
          <section className="space-y-3 border-t border-border-subtle pt-5">
            {isRegistered || successMsg ? (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-accent-emerald">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">
                    Status: {(driveDetail.registration_status || 'REGISTERED').replace(/_/g, ' ')}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-secondary">
                    Your registration for {driveDetail.title} (#{driveDetail.id}) is confirmed.
                  </p>
                </div>
              </div>
            ) : !isOpenForApply ? (
              <div className="rounded-xl border border-border-subtle bg-surface-input/60 p-4 text-xs text-ink-muted">
                Registrations are currently closed for this drive ({driveDetail.status}).
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="rounded-xl border border-border-subtle bg-surface-input/50 p-4 text-xs text-ink-secondary">
                  <div className="flex items-center gap-2 font-semibold text-ink-primary">
                    <Briefcase className="h-4 w-4 text-brand-400" />
                    <span>One-Click Drive Registration</span>
                  </div>
                  <p className="mt-1 text-[11px] text-ink-muted">
                    Submitting registers you for {companyName} ({driveDetail.job_role}) using your student profile and uploaded resume.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isApplying}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 py-2.5 text-xs font-semibold text-white shadow-brand-glow transition hover:bg-brand-600 disabled:opacity-60 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isApplying ? 'Registering...' : 'Register for Drive'}</span>
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}