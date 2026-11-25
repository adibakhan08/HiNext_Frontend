import { useEffect, useState } from 'react';
import {
  X,
  Mail,
  Phone,
  GraduationCap,
  FileText,
  ExternalLink,
  BookOpen,
  Code2,
  Hash,
  Calendar,
} from 'lucide-react';
import { axiosClient } from '../../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../../api/endpoints';

export function CandidateDetailDrawer({ candidateId, onClose }) {
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!candidateId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    axiosClient
      .get(API_ENDPOINTS.ADMIN.CANDIDATE_DETAIL(candidateId))
      .then(({ data }) => {
        if (isMounted) setDetail(data);
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err.response?.data?.detail ||
              err.response?.data?.message ||
              'Unable to load candidate details.'
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [candidateId]);

  if (!candidateId) return null;

  const fullName =
    `${detail?.first_name || ''} ${detail?.last_name || ''}`.trim() ||
    detail?.username ||
    'Candidate Profile';

  const skills = detail?.skills || detail?.candidate_skills || [];
  const educations = detail?.educations || detail?.education || [];
  const resumes = detail?.resumes || (detail?.resume ? [detail.resume] : []);

  const formattedJoinedDate = detail?.created_at
    ? new Date(detail.created_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs">
      <div className="flex h-full w-full max-w-xl flex-col border-l border-border-subtle bg-surface-card shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <div className="flex items-center gap-3">
            {detail?.profile_photo ? (
              <img
                src={detail.profile_photo}
                alt={fullName}
                className="h-10 w-10 rounded-full object-cover border border-border-subtle"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-500/30 bg-brand-500/15 text-sm font-bold text-brand-400">
                {fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-base font-bold text-ink-primary">{fullName}</h2>
              <p className="font-mono text-xs text-ink-muted">
                @{detail?.username || 'student'} · Profile #{candidateId}
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
          {isLoading ? (
            <div className="py-16 text-center text-xs text-ink-muted">
              Fetching candidate details...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-xs text-red-300">
              {error}
            </div>
          ) : (
            detail && (
              <>
                {/* Quick Metric Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-border-subtle bg-surface-input/70 p-3.5">
                    <span className="text-[11px] text-ink-muted">Current CGPA</span>
                    <p className="mt-1 text-base font-bold text-ink-primary">
                      {detail.current_cgpa ?? '—'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border-subtle bg-surface-input/70 p-3.5">
                    <span className="text-[11px] text-ink-muted">Backlogs</span>
                    <p className="mt-1 text-base font-bold text-ink-primary">
                      {detail.backlogs ?? 0}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border-subtle bg-surface-input/70 p-3.5">
                    <span className="text-[11px] text-ink-muted">Graduation</span>
                    <p className="mt-1 text-base font-bold text-ink-primary">
                      {detail.graduation_year ?? '—'}
                    </p>
                  </div>
                </div>

                {/* Personal & Contact Info */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Contact & Account
                  </h3>
                  <div className="grid grid-cols-1 gap-3 rounded-xl border border-border-subtle bg-surface-input/50 p-4 text-xs sm:grid-cols-2">
                    <div className="flex items-center gap-2.5 text-ink-secondary">
                      <Mail className="h-4 w-4 shrink-0 text-brand-400" />
                      <span className="truncate">{detail.email || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-ink-secondary">
                      <Phone className="h-4 w-4 shrink-0 text-brand-400" />
                      <span>{detail.phone || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-ink-secondary">
                      <Hash className="h-4 w-4 shrink-0 text-brand-400" />
                      <span>User ID: {detail.user ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-ink-secondary">
                      <Calendar className="h-4 w-4 shrink-0 text-brand-400" />
                      <span>Joined: {formattedJoinedDate}</span>
                    </div>
                  </div>
                </section>

                {/* Academic Details */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Academic Details
                  </h3>
                  <div className="grid grid-cols-1 gap-3 rounded-xl border border-border-subtle bg-surface-input/50 p-4 text-xs sm:grid-cols-2">
                    <div>
                      <span className="text-ink-muted">Enrollment Number</span>
                      <p className="mt-0.5 font-mono font-medium text-ink-primary">
                        {detail.enrollment_number || 'Not updated'}
                      </p>
                    </div>
                    <div>
                      <span className="text-ink-muted">Department</span>
                      <p className="mt-0.5 font-medium text-ink-primary">
                        {detail.department_name || 'Not updated'}
                      </p>
                    </div>
                    <div>
                      <span className="text-ink-muted">Course</span>
                      <p className="mt-0.5 font-medium text-ink-primary">
                        {detail.course_name || 'Not updated'}
                      </p>
                    </div>
                    <div>
                      <span className="text-ink-muted">Graduation Year</span>
                      <p className="mt-0.5 font-medium text-ink-primary">
                        {detail.graduation_year || 'Not updated'}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Education History */}
                {educations.length > 0 && (
                  <section className="space-y-3">
                    <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      <BookOpen className="h-3.5 w-3.5" />
                      Education History
                    </h3>
                    <div className="space-y-2.5">
                      {educations.map((edu, i) => (
                        <div
                          key={edu.id || i}
                          className="rounded-xl border border-border-subtle bg-surface-input/50 p-3.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-ink-primary">
                              {edu.degree || edu.level || 'Qualification'}
                            </span>
                            <span className="font-medium text-accent-emerald">
                              {edu.percentage || edu.cgpa || ''}
                            </span>
                          </div>
                          <p className="mt-0.5 text-ink-secondary">
                            {edu.institution || edu.board}
                          </p>
                          {edu.passing_year && (
                            <p className="mt-0.5 text-[11px] text-ink-muted">
                              Year: {edu.passing_year}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Skills */}
                <section className="space-y-3">
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    <Code2 className="h-3.5 w-3.5" />
                    Skills
                  </h3>
                  {skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((item, idx) => {
                        const skillLabel =
                          typeof item === 'string'
                            ? item
                            : item.skill_name || item.skill?.name || item.name || 'Skill';
                        return (
                          <span
                            key={item.id || idx}
                            className="rounded-lg border border-brand-500/25 bg-brand-500/12 px-2.5 py-1 text-xs font-medium text-brand-400"
                          >
                            {skillLabel}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-ink-muted">No skills listed yet.</p>
                  )}
                </section>

                {/* Resumes */}
                <section className="space-y-3">
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    <FileText className="h-3.5 w-3.5" />
                    Uploaded Resumes
                  </h3>
                  {resumes.length > 0 ? (
                    <div className="space-y-2">
                      {resumes.map((res, idx) => {
                        const fileUrl = typeof res === 'string' ? res : res.file || res.url;
                        return (
                          <div
                            key={res.id || idx}
                            className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-input/60 px-4 py-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <GraduationCap className="h-4 w-4 text-brand-400" />
                              <span className="font-medium text-ink-primary">
                                {res.title || `Resume #${idx + 1}`}
                              </span>
                            </div>
                            {fileUrl && (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 font-medium text-brand-400 hover:underline"
                              >
                                Open <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-ink-muted">No resume uploaded yet.</p>
                  )}
                </section>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}