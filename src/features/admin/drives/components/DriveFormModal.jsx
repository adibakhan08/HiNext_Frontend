import { useEffect, useState } from "react";
import { X, Briefcase, CheckCircle2 } from "lucide-react";
import { axiosClient } from "../../../../api/axiosClient";
import { API_ENDPOINTS } from "../../../../api/endpoints";

const INITIAL_FORM = {
  company: "",
  academic_session: "1",
  title: "",
  job_role: "",
  job_description: "",
  job_type: "FULL_TIME",
  package_min: "",
  package_max: "",
  location: "",
  openings: "1",
  application_start_date: "",
  application_deadline: "",
  drive_date: "",
  status: "OPEN",
};

const JOB_TYPES = ["FULL_TIME", "INTERNSHIP", "INTERN_PLUS_FTE", "CONTRACT"];
const STATUS_OPTIONS = ["OPEN", "UPCOMING", "ONGOING", "CLOSED", "COMPLETED"];

// Helper: ISO string -> "YYYY-MM-DDTHH:mm" for <input type="datetime-local" />
function toDateTimeLocal(isoStr) {
  if (!isoStr) return "";
  return isoStr.slice(0, 16);
}

// Helper: "YYYY-MM-DDTHH:mm" -> "YYYY-MM-DDTHH:mm:00Z"
function toIsoUtc(localStr) {
  if (!localStr) return null;
  if (localStr.endsWith("Z")) return localStr;
  return localStr.length === 16
    ? `${localStr}:00Z`
    : new Date(localStr).toISOString();
}

export function DriveFormModal({ isOpen, onClose, drive, onSaved }) {
  const isEditing = Boolean(drive?.id);
  const [form, setForm] = useState(INITIAL_FORM);
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add sessions state inside DriveFormModal:
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    Promise.allSettled([
      axiosClient.get(API_ENDPOINTS.ADMIN.COMPANIES),
      axiosClient.get(API_ENDPOINTS.ACADEMICS.SESSIONS),
    ]).then(([compRes, sessRes]) => {
      if (compRes.status === "fulfilled") {
        const d = compRes.value.data;
        setCompanies(Array.isArray(d) ? d : d.results || []);
      }
      if (sessRes.status === "fulfilled") {
        const d = sessRes.value.data;
        const list = Array.isArray(d) ? d : d.results || [];
        setSessions(list);

        // Auto-select the active academic session when creating a new drive
        if (!drive) {
          const active = list.find((s) => s.is_active) || list[0];
          if (active) {
            setForm((prev) => ({
              ...prev,
              academic_session: String(active.id),
            }));
          }
        }
      }
    });
  }, [isOpen, drive]);

  useEffect(() => {
    if (!isOpen) return;

    axiosClient
      .get(API_ENDPOINTS.ADMIN.COMPANIES)
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : data.results || [];
        setCompanies(list);
      })
      .catch(() => {
        setCompanies([]);
      });
  }, [isOpen]);

  useEffect(() => {
    if (drive) {
      setForm({
        company: String(drive.company?.id ?? drive.company ?? ""),
        academic_session: String(
          drive.academic_session?.id ?? drive.academic_session ?? "1",
        ),
        title: drive.title || "",
        job_role: drive.job_role || "",
        job_description: drive.job_description || "",
        job_type: drive.job_type || "FULL_TIME",
        package_min: drive.package_min ?? "",
        package_max: drive.package_max ?? "",
        location: drive.location || "",
        openings: String(drive.openings ?? "1"),
        application_start_date: toDateTimeLocal(drive.application_start_date),
        application_deadline: toDateTimeLocal(drive.application_deadline),
        drive_date: toDateTimeLocal(drive.drive_date),
        status: drive.status || "OPEN",
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setError(null);
    setSuccessMsg(null);
  }, [drive, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleFillSample = () => {
    setForm({
      company: companies[0]?.id ? String(companies[0].id) : "1",
      academic_session: "1",
      title: "TCS Graduate Hiring 2027",
      job_role: "Software Developer",
      job_description:
        "Hiring fresh graduates for software development roles. Candidates should have knowledge of programming, data structures, algorithms and databases.",
      job_type: "FULL_TIME",
      package_min: "400000",
      package_max: "700000",
      location: "Pune",
      openings: "50",
      application_start_date: "2026-11-23T09:00",
      application_deadline: "2026-12-10T18:00",
      drive_date: "2026-12-20T09:00",
      status: "OPEN",
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    const payload = {
      company: Number(form.company),
      academic_session: Number(form.academic_session),
      title: form.title.trim(),
      job_role: form.job_role.trim(),
      job_description: form.job_description.trim(),
      job_type: form.job_type,
      package_min: String(form.package_min).trim(),
      package_max: String(form.package_max).trim(),
      location: form.location.trim(),
      openings: Number(form.openings),
      application_start_date: toIsoUtc(form.application_start_date),
      application_deadline: toIsoUtc(form.application_deadline),
      drive_date: toIsoUtc(form.drive_date),
      status: form.status,
    };

    try {
      const { data } = isEditing
        ? await axiosClient.patch(
            API_ENDPOINTS.ADMIN.DRIVE_DETAIL(drive.id),
            payload,
          )
        : await axiosClient.post(API_ENDPOINTS.ADMIN.DRIVES, payload);

      setSuccessMsg(
        isEditing
          ? "Placement drive updated."
          : "Drive created! Opening eligibility setup...",
      );
      onSaved?.(data, isEditing);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 500);
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
            `${firstKey}: ${firstVal}` ||
            "Failed to save placement drive.",
        );
      } else {
        setError("Network error while saving placement drive.");
      }
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
              <h2 className="text-base font-bold text-ink-primary">
                {isEditing ? "Edit Placement Drive" : "Create Placement Drive"}
              </h2>
              <p className="text-xs text-ink-muted">
                Configure role, compensation range, openings, and drive schedule
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
        {!isEditing && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-brand-500/20 bg-brand-900/20 px-3.5 py-2.5 text-xs">
            <span className="text-ink-secondary">
              Fill sample drive (
              <span className="text-brand-400">TCS Graduate Hiring 2027</span>)
            </span>
            <button
              type="button"
              onClick={handleFillSample}
              className="font-medium text-brand-400 hover:underline cursor-pointer"
            >
              Fill sample
            </button>
          </div>
        )}

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
          {/* Row 1: Company, Academic Session & Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label
                htmlFor="company"
                className="block text-xs font-medium text-ink-secondary"
              >
                Company
              </label>
              {companies.length > 0 ? (
                <select
                  id="company"
                  name="company"
                  required
                  value={form.company}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="" className="bg-surface-card text-ink-muted">
                    Select company...
                  </option>
                  {companies.map((c) => (
                    <option
                      key={c.id}
                      value={c.id}
                      className="bg-surface-card text-ink-primary"
                    >
                      {c.name} (#{c.id})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="company"
                  name="company"
                  type="number"
                  min="1"
                  required
                  placeholder="1"
                  value={form.company}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="academic_session"
                className="block text-xs font-medium text-ink-secondary"
              >
                Academic Session
              </label>
              {sessions.length > 0 ? (
                <select
                  id="academic_session"
                  name="academic_session"
                  required
                  value={form.academic_session}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="" className="bg-surface-card text-ink-muted">
                    Select session...
                  </option>
                  {sessions.map((s) => (
                    <option
                      key={s.id}
                      value={s.id}
                      className="bg-surface-card text-ink-primary"
                    >
                      {s.name} {s.is_active ? "(Active)" : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="academic_session"
                  name="academic_session"
                  type="number"
                  min="1"
                  required
                  placeholder="1"
                  value={form.academic_session}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="status"
                className="block text-xs font-medium text-ink-secondary"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option
                    key={st}
                    value={st}
                    className="bg-surface-card text-ink-primary"
                  >
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Title & Job Role */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="title"
                className="block text-xs font-medium text-ink-secondary"
              >
                Drive title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="TCS Graduate Hiring 2027"
                value={form.title}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="job_role"
                className="block text-xs font-medium text-ink-secondary"
              >
                Job role
              </label>
              <input
                id="job_role"
                name="job_role"
                type="text"
                required
                placeholder="Software Developer"
                value={form.job_role}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Row 3: Job Type, Location & Openings */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label
                htmlFor="job_type"
                className="block text-xs font-medium text-ink-secondary"
              >
                Job type
              </label>
              <select
                id="job_type"
                name="job_type"
                value={form.job_type}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {JOB_TYPES.map((jt) => (
                  <option
                    key={jt}
                    value={jt}
                    className="bg-surface-card text-ink-primary"
                  >
                    {jt}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="location"
                className="block text-xs font-medium text-ink-secondary"
              >
                Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                required
                placeholder="Pune"
                value={form.location}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="openings"
                className="block text-xs font-medium text-ink-secondary"
              >
                Openings
              </label>
              <input
                id="openings"
                name="openings"
                type="number"
                min="1"
                required
                placeholder="50"
                value={form.openings}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Row 4: Package Min & Package Max */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="package_min"
                className="block text-xs font-medium text-ink-secondary"
              >
                Minimum Package (INR / annum)
              </label>
              <input
                id="package_min"
                name="package_min"
                type="number"
                min="0"
                required
                placeholder="400000"
                value={form.package_min}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="package_max"
                className="block text-xs font-medium text-ink-secondary"
              >
                Maximum Package (INR / annum)
              </label>
              <input
                id="package_max"
                name="package_max"
                type="number"
                min="0"
                required
                placeholder="700000"
                value={form.package_max}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Row 5: Application Start, Application Deadline & Drive Date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label
                htmlFor="application_start_date"
                className="block text-xs font-medium text-ink-secondary"
              >
                Application start
              </label>
              <input
                id="application_start_date"
                name="application_start_date"
                type="datetime-local"
                required
                value={form.application_start_date}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-xs text-ink-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="application_deadline"
                className="block text-xs font-medium text-ink-secondary"
              >
                Application deadline
              </label>
              <input
                id="application_deadline"
                name="application_deadline"
                type="datetime-local"
                required
                value={form.application_deadline}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-xs text-ink-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="drive_date"
                className="block text-xs font-medium text-ink-secondary"
              >
                Drive date & time
              </label>
              <input
                id="drive_date"
                name="drive_date"
                type="datetime-local"
                required
                value={form.drive_date}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-xs text-ink-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Row 6: Job Description */}
          <div className="space-y-1.5">
            <label
              htmlFor="job_description"
              className="block text-xs font-medium text-ink-secondary"
            >
              Job description
            </label>
            <textarea
              id="job_description"
              name="job_description"
              rows={3}
              required
              placeholder="Hiring fresh graduates for software development roles..."
              value={form.job_description}
              onChange={handleChange}
              className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
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
              <Briefcase className="h-3.5 w-3.5" />
              <span>
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                    ? "Save Changes"
                    : "Create Drive"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
