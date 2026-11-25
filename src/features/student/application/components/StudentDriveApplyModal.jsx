import { useEffect, useState } from "react";
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
  FileText,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { axiosClient } from "../../../../api/axiosClient";
import { API_ENDPOINTS } from "../../../../api/endpoints";

function formatPackageRange(minVal, maxVal) {
  const minNum = parseFloat(minVal);
  const maxNum = parseFloat(maxVal);
  if (!minNum && !maxNum) return "Not disclosed";

  const toLpa = (val) =>
    val >= 10000 ? `${(val / 100000).toFixed(1)}` : `${val}`;
  if (minNum && maxNum && minNum !== maxNum) {
    return `${toLpa(minNum)} – ${toLpa(maxNum)} LPA`;
  }
  return `${toLpa(maxNum || minNum)} LPA`;
}

function formatDateTime(isoStr) {
  if (!isoStr) return "—";
  return new Date(isoStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function extractResumeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (data && (data.id || data.resume_file || data.file || data.url)) return [data];
  return [];
}

function getResumeFileUrl(res) {
  if (!res || typeof res === "string") return res || "";
  return res.resume_file || res.file || res.url || "";
}

export function StudentDriveApplyModal({
  drive,
  onClose,
  onApplied,
}) {
  const driveId = drive?.drive_id ?? drive?.id;

  const [driveDetail, setDriveDetail] = useState(drive);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");

  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    setDriveDetail(drive);
    setError(null);
    setSuccessMsg(null);
    setSelectedResumeId("");

    if (!driveId) return;

    let isMounted = true;
    setIsLoadingDetail(true);
    setIsLoadingResumes(true);

    Promise.allSettled([
      axiosClient.get(API_ENDPOINTS.STUDENT.DRIVE_DETAIL(driveId)),
      axiosClient.get(API_ENDPOINTS.STUDENT.RESUME),
    ]).then(([detailRes, resumeRes]) => {
      if (!isMounted) return;

      if (detailRes.status === "fulfilled" && detailRes.value?.data) {
        setDriveDetail((prev) => ({
          ...prev,
          ...detailRes.value.data,
        }));
      }

      if (resumeRes.status === "fulfilled") {
        const list = extractResumeList(resumeRes.value?.data);
        setResumes(list);

        const primary = list.find((r) => r.is_primary) || list[0];
        if (primary?.id != null) {
          setSelectedResumeId(String(primary.id));
        }
      }

      setIsLoadingDetail(false);
      setIsLoadingResumes(false);
    });

    return () => {
      isMounted = false;
    };
  }, [drive, driveId]);

  if (!driveDetail) return null;

  const title =
    driveDetail.drive_title || driveDetail.title || driveDetail.job_role;
  const companyName =
    driveDetail.company_name ||
    driveDetail.company?.name ||
    (driveDetail.company
      ? `Company #${driveDetail.company}`
      : "Recruiting Partner");

  const eligibility =
    driveDetail.eligibility && typeof driveDetail.eligibility === "object"
      ? driveDetail.eligibility
      : null;

  const eligibleDepts = eligibility?.eligible_departments_names || [];
  const eligibleCourses = eligibility?.eligible_courses_names || [];

  const normalizedAppStatus = String(driveDetail.application_status || "")
    .trim()
    .toUpperCase();

  const isApplied =
    (Boolean(normalizedAppStatus) &&
      normalizedAppStatus !== "NOT_APPLIED" &&
      normalizedAppStatus !== "NONE") ||
    Boolean(driveDetail.is_applied) ||
    driveDetail.application_id != null ||
    Boolean(successMsg);

  const isDeadlinePassed = driveDetail.application_deadline
    ? new Date(driveDetail.application_deadline).getTime() < Date.now()
    : false;

  const isIneligible = driveDetail.eligibility_status === "INELIGIBLE";

  const canSubmit =
    !isApplied &&
    !isDeadlinePassed &&
    !isIneligible &&
    Boolean(selectedResumeId) &&
    !isSubmitting;

  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedResumeId) {
      setError("Please select a resume before submitting your application.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload = {
        drive: Number(driveId),
        resume: Number(selectedResumeId),
      };

      const { data } = await axiosClient.post(
        API_ENDPOINTS.STUDENT.APPLICATIONS,
        payload,
      );

      setDriveDetail((prev) => ({
        ...prev,
        is_applied: true,
        application_id: data?.id ?? data?.application_id ?? prev.application_id,
        application_status:
          data?.status ?? data?.application_status ?? "APPLIED",
      }));

      setSuccessMsg("Application submitted successfully!");
      onApplied?.(Number(driveId), data);
    } catch (err) {
      const resData = err.response?.data;
      if (typeof resData === "string") {
        setError(resData);
      } else if (resData && typeof resData === "object") {
        const firstKey = Object.keys(resData)[0];
        const firstVal = Array.isArray(resData[firstKey])
          ? resData[firstKey][0]
          : resData[firstKey];
        setError(
          resData.detail ||
            resData.message ||
            resData.non_field_errors?.[0] ||
            `${firstKey}: ${firstVal}` ||
            "Unable to submit application for this drive.",
        );
      } else {
        setError("Network error while submitting application.");
      }
    } finally {
      setIsSubmitting(false);
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
                  {title}
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
                {formatPackageRange(
                  driveDetail.package_min,
                  driveDetail.package_max,
                )}
              </p>
            </div>

            <div className="rounded-xl border border-border-subtle bg-surface-input/70 p-3.5">
              <span className="text-[11px] text-ink-muted">Openings</span>
              <p className="mt-1 text-sm font-bold text-ink-primary">
                {driveDetail.openings ?? "—"} seats
              </p>
            </div>

            <div className="rounded-xl border border-border-subtle bg-surface-input/70 p-3.5">
              <span className="text-[11px] text-ink-muted">Job Type</span>
              <p className="mt-1 text-xs font-semibold text-ink-primary">
                {(driveDetail.job_type || "FULL_TIME").replace(/_/g, " ")}
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
              <div className="flex items-center gap-2">
                {driveDetail.eligibility_status && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                      driveDetail.eligibility_status === "ELIGIBLE"
                        ? "bg-emerald-500/15 text-accent-emerald"
                        : "bg-red-500/15 text-red-400"
                    }`}
                  >
                    {driveDetail.eligibility_status}
                  </span>
                )}
                {eligibility?.graduation_year && (
                  <span className="rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-300">
                    Batch {eligibility.graduation_year}
                  </span>
                )}
              </div>
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
                      <span>{eligibility.minimum_cgpa ?? "0.00"}</span>
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
                      {eligibility.graduation_year || "—"}
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
                  {typeof driveDetail.eligibility === "string"
                    ? driveDetail.eligibility
                    : "Open to all eligible students in this academic session."}
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
                  <span>
                    Academic Session: {driveDetail.academic_session_name}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2.5 text-ink-secondary">
                <MapPin className="h-4 w-4 shrink-0 text-brand-400" />
                <span>
                  Location: {driveDetail.location || "On-Campus / Hybrid"}
                </span>
              </div>

              {driveDetail.application_start_date && (
                <div className="flex items-center gap-2.5 text-ink-secondary">
                  <Users className="h-4 w-4 shrink-0 text-sky-400" />
                  <span>
                    Applications Open:{" "}
                    {formatDateTime(driveDetail.application_start_date)}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2.5 text-ink-secondary">
                <Clock className="h-4 w-4 shrink-0 text-accent-amber" />
                <span>
                  Application Deadline:{" "}
                  {formatDateTime(driveDetail.application_deadline)}
                </span>
              </div>

              {driveDetail.drive_date && (
                <div className="flex items-center gap-2.5 text-ink-secondary">
                  <Calendar className="h-4 w-4 shrink-0 text-accent-emerald" />
                  <span>Drive Date: {formatDateTime(driveDetail.drive_date)}</span>
                </div>
              )}
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
                "No additional role description provided."}
            </div>
          </section>

          {/* Resume Selection & Application Submission */}
          <section className="space-y-3 border-t border-border-subtle pt-5">
            {isApplied ? (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-accent-emerald">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">
                    Application Status:{" "}
                    {(normalizedAppStatus || "APPLIED").replace(/_/g, " ")}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-secondary">
                    Your application for {title} (#{driveId}) has been
                    submitted.
                  </p>
                </div>
              </div>
            ) : isDeadlinePassed ? (
              <div className="rounded-xl border border-border-subtle bg-surface-input/60 p-4 text-xs text-ink-muted">
                The application deadline for this drive has passed.
              </div>
            ) : isIneligible ? (
              <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-300">
                You do not meet the eligibility criteria for this drive.
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      <FileText className="h-3.5 w-3.5 text-brand-400" />
                      <span>Select Resume to Submit</span>
                    </label>
                    <span className="text-[11px] text-ink-muted">
                      {resumes.length} available
                    </span>
                  </div>

                  {isLoadingResumes ? (
                    <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-input/50 p-4 text-xs text-ink-muted">
                      <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
                      <span>Loading your uploaded resumes...</span>
                    </div>
                  ) : resumes.length === 0 ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-300">
                      <p className="font-semibold">No Resume Found</p>
                      <p className="mt-1 text-[11px] text-ink-secondary">
                        Upload a resume in{" "}
                        <span className="font-medium text-ink-primary">
                          Profile &amp; Resume
                        </span>{" "}
                        before submitting your application.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {resumes.map((res, idx) => {
                        const resId = String(res.id ?? idx);
                        const isSelected = selectedResumeId === resId;
                        const fileUrl = getResumeFileUrl(res);

                        return (
                          <label
                            key={resId}
                            className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 text-xs transition cursor-pointer ${
                              isSelected
                                ? "border-brand-500 bg-brand-500/10"
                                : "border-border-subtle bg-surface-input/50 hover:border-border-focus/50"
                            }`}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <input
                                type="radio"
                                name="selected_resume"
                                value={resId}
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedResumeId(resId);
                                  setError(null);
                                }}
                                className="h-4 w-4 accent-brand-500 cursor-pointer"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="truncate font-semibold text-ink-primary">
                                    {res.title ||
                                      `Resume #${res.id || idx + 1}`}
                                  </span>
                                  {res.is_primary && (
                                    <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-accent-emerald">
                                      Primary
                                    </span>
                                  )}
                                </div>
                                {res.uploaded_at && (
                                  <p className="mt-0.5 text-[11px] text-ink-muted">
                                    Uploaded {formatDateTime(res.uploaded_at)}
                                  </p>
                                )}
                              </div>
                            </div>

                            {fileUrl && (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border-subtle bg-surface-card px-2 py-1 text-[11px] font-medium text-brand-400 hover:border-brand-500/40"
                              >
                                <span>Preview</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-border-subtle bg-surface-input/50 p-3.5 text-[11px] text-ink-muted">
                  <div className="flex items-center gap-1.5 font-semibold text-ink-primary">
                    <Briefcase className="h-3.5 w-3.5 text-brand-400" />
                    <span>Final Application Submission</span>
                  </div>
                  <p className="mt-1">
                    Your academic profile and the selected resume will be shared
                    with {companyName} for the {driveDetail.job_role} role.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 py-2.5 text-xs font-semibold text-white shadow-brand-glow transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Submit Application</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}