import { useCallback, useEffect, useState } from 'react';
import {
  CalendarRange,
  Plus,
  CheckCircle2,
  Pencil,
  Trash2,
  Building,
  GraduationCap,
} from 'lucide-react';
import { axiosClient } from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import { Topbar } from '../../../components/layout/Topbar';
import { SessionFormModal } from './components/SessionFormModal';

export function AcademicsPage() {
  const [activeTab, setActiveTab] = useState('SESSIONS'); // 'SESSIONS' | 'DEPARTMENTS' | 'COURSES'

  // Academic Sessions state
  const [sessions, setSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  // Departments & Courses state
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseDept, setCourseDept] = useState('');

  const [error, setError] = useState(null);

  const fetchSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const { data } = await axiosClient.get(API_ENDPOINTS.ACADEMICS.SESSIONS);
      setSessions(Array.isArray(data) ? data : data.results || []);
    } catch {
      setSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  const fetchDepartmentsAndCourses = useCallback(async () => {
    const [deptRes, courseRes] = await Promise.allSettled([
      axiosClient.get(API_ENDPOINTS.ACADEMICS.DEPARTMENTS),
      axiosClient.get(API_ENDPOINTS.ACADEMICS.COURSES),
    ]);
    if (deptRes.status === 'fulfilled') {
      const d = deptRes.value.data;
      setDepartments(Array.isArray(d) ? d : d.results || []);
    }
    if (courseRes.status === 'fulfilled') {
      const c = courseRes.value.data;
      setCourses(Array.isArray(c) ? c : c.results || []);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchDepartmentsAndCourses();
  }, [fetchSessions, fetchDepartmentsAndCourses]);

  const handleSetActiveSession = async (session) => {
    setError(null);
    try {
      await axiosClient.patch(API_ENDPOINTS.ACADEMICS.SESSION_DETAIL(session.id), {
        is_active: true,
      });
      fetchSessions();
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to activate session.');
    }
  };

  const handleDeleteSession = async (session) => {
    if (!window.confirm(`Delete session "${session.name}"?`)) return;
    try {
      await axiosClient.delete(API_ENDPOINTS.ACADEMICS.SESSION_DETAIL(session.id));
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to delete session.');
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!deptName.trim()) return;
    setError(null);
    try {
      await axiosClient.post(API_ENDPOINTS.ACADEMICS.DEPARTMENTS, {
        name: deptName.trim(),
        code: deptCode.trim().toUpperCase(),
      });
      setDeptName('');
      setDeptCode('');
      fetchDepartmentsAndCourses();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add department.');
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!courseName.trim()) return;
    setError(null);
    try {
      await axiosClient.post(API_ENDPOINTS.ACADEMICS.COURSES, {
        name: courseName.trim(),
        ...(courseDept ? { department: Number(courseDept) } : {}),
      });
      setCourseName('');
      setCourseDept('');
      fetchDepartmentsAndCourses();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add course.');
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <Topbar
        title="Academics & Sessions"
        subtitle="Manage placement academic sessions, departments, and courses"
      />

      <main className="flex-1 space-y-6 p-7">
        {/* Top Tabs & Action Button */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface-input p-1">
            {[
              { key: 'SESSIONS', label: 'Academic Sessions', icon: CalendarRange },
              { key: 'DEPARTMENTS', label: 'Departments', icon: Building },
              { key: 'COURSES', label: 'Courses', icon: GraduationCap },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setActiveTab(key);
                  setError(null);
                }}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition cursor-pointer ${
                  activeTab === key
                    ? 'bg-brand-500 text-white shadow-brand-glow'
                    : 'text-ink-secondary hover:text-ink-primary'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {activeTab === 'SESSIONS' && (
            <button
              type="button"
              onClick={() => {
                setEditingSession(null);
                setIsSessionModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-xs font-semibold text-white shadow-brand-glow transition hover:bg-brand-600 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Academic Session</span>
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* TAB 1: ACADEMIC SESSIONS */}
        {activeTab === 'SESSIONS' && (
          <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-card">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-input/60 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                    <th className="px-5 py-3.5">ID</th>
                    <th className="px-5 py-3.5">Academic Session</th>
                    <th className="px-5 py-3.5">Duration</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/70 text-xs">
                  {isLoadingSessions ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-ink-muted">
                        Loading academic sessions...
                      </td>
                    </tr>
                  ) : sessions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-14 text-center text-ink-muted">
                        No academic sessions found. Click &ldquo;Add Academic Session&rdquo; to create one.
                      </td>
                    </tr>
                  ) : (
                    sessions.map((item) => (
                      <tr key={item.id} className="transition hover:bg-surface-elevated/40">
                        <td className="px-5 py-3.5 font-mono text-ink-muted">#{item.id}</td>
                        <td className="px-5 py-3.5 font-semibold text-ink-primary">
                          {item.name}
                        </td>
                        <td className="px-5 py-3.5 text-ink-secondary">
                          {item.start_date?.slice(0, 10) || '—'} to{' '}
                          {item.end_date?.slice(0, 10) || '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          {item.is_active ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-accent-emerald">
                              <CheckCircle2 className="h-3 w-3" />
                              Active Season
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-ink-muted/15 px-2.5 py-0.5 text-[11px] font-medium text-ink-muted">
                              Archived
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            {!item.is_active && (
                              <button
                                type="button"
                                onClick={() => handleSetActiveSession(item)}
                                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-medium text-accent-emerald transition hover:bg-emerald-500/20 cursor-pointer"
                              >
                                Set Active
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSession(item);
                                setIsSessionModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-input px-2.5 py-1.5 text-[11px] font-medium text-ink-secondary transition hover:border-brand-500/40 hover:text-brand-400 cursor-pointer"
                            >
                              <Pencil className="h-3 w-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSession(item)}
                              className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-input px-2.5 py-1.5 text-[11px] font-medium text-ink-secondary transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: DEPARTMENTS */}
        {activeTab === 'DEPARTMENTS' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
            <form
              onSubmit={handleCreateDepartment}
              className="space-y-4 rounded-xl border border-border-subtle bg-surface-card p-5 h-fit"
            >
              <h3 className="text-sm font-semibold text-ink-primary">Add Department</h3>
              <div className="space-y-1.5">
                <label className="block text-xs text-ink-secondary">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="Computer Science & Engineering"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-xs text-ink-primary focus:border-border-focus focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs text-ink-secondary">Code</label>
                <input
                  type="text"
                  placeholder="CSE"
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-xs text-ink-primary focus:border-border-focus focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-brand-500 py-2 text-xs font-semibold text-white shadow-brand-glow hover:bg-brand-600 cursor-pointer"
              >
                Save Department
              </button>
            </form>

            <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-card">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-input/60 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                    <th className="px-5 py-3.5">ID</th>
                    <th className="px-5 py-3.5">Code</th>
                    <th className="px-5 py-3.5">Department Name</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/70">
                  {departments.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-10 text-center text-ink-muted">
                        No departments added yet.
                      </td>
                    </tr>
                  ) : (
                    departments.map((d) => (
                      <tr key={d.id}>
                        <td className="px-5 py-3 font-mono text-ink-muted">#{d.id}</td>
                        <td className="px-5 py-3 font-mono font-semibold text-brand-400">
                          {d.code || '—'}
                        </td>
                        <td className="px-5 py-3 font-medium text-ink-primary">{d.name}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: COURSES */}
        {activeTab === 'COURSES' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
            <form
              onSubmit={handleCreateCourse}
              className="space-y-4 rounded-xl border border-border-subtle bg-surface-card p-5 h-fit"
            >
              <h3 className="text-sm font-semibold text-ink-primary">Add Course</h3>
              <div className="space-y-1.5">
                <label className="block text-xs text-ink-secondary">Course Name</label>
                <input
                  type="text"
                  required
                  placeholder="B.Tech"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-xs text-ink-primary focus:border-border-focus focus:outline-none"
                />
              </div>
              {departments.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-xs text-ink-secondary">Department</label>
                  <select
                    value={courseDept}
                    onChange={(e) => setCourseDept(e.target.value)}
                    className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-xs text-ink-primary focus:border-border-focus focus:outline-none"
                  >
                    <option value="">All / Optional</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button
                type="submit"
                className="w-full rounded-lg bg-brand-500 py-2 text-xs font-semibold text-white shadow-brand-glow hover:bg-brand-600 cursor-pointer"
              >
                Save Course
              </button>
            </form>

            <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-card">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-input/60 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                    <th className="px-5 py-3.5">ID</th>
                    <th className="px-5 py-3.5">Course Name</th>
                    <th className="px-5 py-3.5">Department</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/70">
                  {courses.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-10 text-center text-ink-muted">
                        No courses added yet.
                      </td>
                    </tr>
                  ) : (
                    courses.map((c) => (
                      <tr key={c.id}>
                        <td className="px-5 py-3 font-mono text-ink-muted">#{c.id}</td>
                        <td className="px-5 py-3 font-medium text-ink-primary">{c.name}</td>
                        <td className="px-5 py-3 text-ink-secondary">
                          {c.department_name || c.department?.name || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <SessionFormModal
        isOpen={isSessionModalOpen}
        onClose={() => {
          setIsSessionModalOpen(false);
          setEditingSession(null);
        }}
        session={editingSession}
        onSaved={fetchSessions}
      />
    </div>
  );
}