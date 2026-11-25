import { useCallback, useEffect, useState } from "react";
import {
  FileCheck2,
  Send,
  Clock,
  ShieldCheck,
  Search,
  MapPin,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";
import { axiosClient } from "../../../api/axiosClient";
import { API_ENDPOINTS } from "../../../api/endpoints";
import { Topbar } from "../../../components/layout/Topbar";
import { StatCard } from "../../../components/ui/StatCard";
import { StudentDriveApplyModal } from "./components/StudentDriveApplyModal";
import { ApplicationTrackingModal } from "./components/ApplicationTrackingModal";

const APPLICATION_STATUS_BADGE = {
  APPLIED: "bg-indigo-500/15 text-indigo-400",
  UNDER_REVIEW: "bg-sky-500/15 text-sky-400",
  SHORTLISTED: "bg-emerald-500/15 text-accent-emerald",
  INTERVIEW: "bg-violet-500/15 text-violet-400",
  OFFERED: "bg-emerald-500/15 text-accent-emerald",
  SELECTED: "bg-emerald-500/15 text-accent-emerald",
  REJECTED: "bg-red-500/15 text-red-400",
  WITHDRAWN: "bg-ink-muted/15 text-ink-secondary",
  NOT_APPLIED: "bg-amber-500/15 text-accent-amber",
};

const ELIGIBILITY_BADGE = {
  ELIGIBLE: "bg-emerald-500/15 text-accent-emerald",
  INELIGIBLE: "bg-red-500/15 text-red-400",
  PENDING: "bg-amber-500/15 text-accent-amber",
};

function normalizeEndpoint(url) {
  if (!url) return "";
  return url.startsWith("/") ? url : `/${url}`;
}

function hasSubmittedApplication(item) {
  if (!item) return false;
  const status = String(item.application_status || "")
    .trim()
    .toUpperCase();
  if (status && status !== "NOT_APPLIED" && status !== "NONE") {
    return true;
  }
  return Boolean(item.is_applied) || item.application_id != null;
}

function formatPackageRange(minVal, maxVal) {
  const minNum = parseFloat(minVal);
  const maxNum = parseFloat(maxVal);
  if (!minNum && !maxNum) return "—";

  const toLpa = (val) =>
    val >= 10000 ? `${(val / 100000).toFixed(1)}` : `${val}`;

  if (minNum && maxNum && minNum !== maxNum) {
    return `${toLpa(minNum)} – ${toLpa(maxNum)} LPA`;
  }
  return `${toLpa(maxNum || minNum)} LPA`;
}

function formatDeadline(isoStr) {
  if (!isoStr) return "—";
  return new Date(isoStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isDeadlinePassed(isoStr) {
  if (!isoStr) return false;
  return new Date(isoStr).getTime() < Date.now();
}

export function StudentApplicationsPage() {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [selectedDrive, setSelectedDrive] = useState(null);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = normalizeEndpoint(API_ENDPOINTS.STUDENT.REGISTERED_DRIVE);
      const { data } = await axiosClient.get(url);
      const list = Array.isArray(data) ? data : data?.results || [];
      setItems(list);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to load your registered drives and applications.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleDriveApplied = (appliedDriveId, data) => {
    setItems((prev) =>
      prev.map((row) =>
        Number(row.drive_id ?? row.id) === Number(appliedDriveId)
          ? {
              ...row,
              is_applied: true,
              application_id:
                data?.id ?? data?.application_id ?? row.application_id,
              application_status:
                data?.status ?? data?.application_status ?? "APPLIED",
            }
          : row,
      ),
    );

    setFeedback({
      type: "success",
      text: "Application submitted successfully!",
    });
  };

  const filteredItems = items.filter((item) => {
    const applied = hasSubmittedApplication(item);
    const expired = isDeadlinePassed(item.application_deadline);

    if (statusTab === "APPLIED" && !applied) return false;
    if (statusTab === "READY_TO_APPLY" && (applied || expired)) return false;
    if (statusTab === "EXPIRED" && (applied || !expired)) return false;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    return (
      (item.drive_title || "").toLowerCase().includes(q) ||
      (item.company_name || "").toLowerCase().includes(q) ||
      (item.job_role || "").toLowerCase().includes(q) ||
      (item.location || "").toLowerCase().includes(q)
    );
  });

  const totalRegistered = items.length;
  const appliedCount = items.filter(hasSubmittedApplication).length;
  const pendingApplyCount = items.filter(
    (i) =>
      !hasSubmittedApplication(i) &&
      !isDeadlinePassed(i.application_deadline) &&
      i.eligibility_status === "ELIGIBLE",
  ).length;
  const eligibleCount = items.filter(
    (i) => i.eligibility_status === "ELIGIBLE",
  ).length;

  return (
    <div className="flex flex-1 flex-col">
      <Topbar
        title="My Applications"
        subtitle="Track registered drives, submit applications, and monitor hiring status"
      />

      <main className="flex-1 space-y-6 p-7">
        {/* KPI Row */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Briefcase}
            badgeText="Registered"
            value={totalRegistered}
            label="Registered Drives"
            caption="Drives you have signed up for"
            accent="indigo"
          />

          <StatCard
            icon={FileCheck2}
            badgeText="Submitted"
            value={appliedCount}
            label="Applications Submitted"
            caption="Active applications in review"
            accent="emerald"
          />

          <StatCard
            icon={Send}
            badgeText="Action Needed"
            value={pendingApplyCount}
            label="Ready to Apply"
            caption="Eligible & before deadline"
            accent="amber"
          />

          <StatCard
            icon={ShieldCheck}
            badgeText="Criteria"
            value={eligibleCount}
            label="Eligible Drives"
            caption="Matching profile & eligibility"
            accent="violet"
          />
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search drive, company, role, location..."
              className="w-full rounded-lg border border-border-subtle bg-surface-input py-2 pl-9 pr-3.5 text-xs text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border-subtle bg-surface-input p-1">
            {[
              { key: "ALL", label: `All (${totalRegistered})` },
              {
                key: "READY_TO_APPLY",
                label: `Ready to Apply (${pendingApplyCount})`,
              },
              { key: "APPLIED", label: `Applied (${appliedCount})` },
              { key: "EXPIRED", label: "Deadline Passed" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusTab(tab.key)}
                className={`rounded-md px-3 py-1 text-[11px] font-medium transition cursor-pointer ${
                  statusTab === tab.key
                    ? "bg-brand-500 text-white"
                    : "text-ink-secondary hover:text-ink-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs ${
              feedback.type === "success"
                ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-300"
                : "border-red-500/30 bg-red-950/30 text-red-300"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-accent-emerald" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Applications Grid */}
        {isLoading ? (
          <div className="rounded-xl border border-border-subtle bg-surface-card px-6 py-14 text-center text-xs text-ink-muted">
            Loading your applications...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-xl border border-border-subtle bg-surface-card px-6 py-14 text-center text-xs text-ink-muted">
            No matching registered drives or applications found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => {
              const applied = hasSubmittedApplication(item);
              const expired = isDeadlinePassed(item.application_deadline);
              const eligible = item.eligibility_status === "ELIGIBLE";
              const canApply = !applied && !expired && eligible;
              const rowKey = item.registration_id ?? item.drive_id;

              const normalizedAppStatus = String(item.application_status || "")
                .trim()
                .toUpperCase();

              const statusLabel = applied
                ? (normalizedAppStatus || "APPLIED").replace(/_/g, " ")
                : expired
                  ? "DEADLINE PASSED"
                  : "NOT APPLIED";

              const badgeClass = applied
                ? APPLICATION_STATUS_BADGE[normalizedAppStatus] ||
                  APPLICATION_STATUS_BADGE.APPLIED
                : expired
                  ? "bg-ink-muted/15 text-ink-secondary"
                  : APPLICATION_STATUS_BADGE.NOT_APPLIED;

              return (
                <article
                  key={rowKey}
                  className="flex flex-col justify-between rounded-xl border border-border-subtle bg-surface-card p-5 transition hover:border-border-focus/50"
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/12 text-sm font-bold text-accent-amber">
                          {(item.company_name || "C").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-ink-secondary">
                            {item.company_name}
                          </p>
                          <h3 className="text-sm font-semibold text-ink-primary">
                            {item.job_role}
                          </h3>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeClass}`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    {/* Drive Title & Eligibility */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-ink-primary">
                        {item.drive_title}
                      </p>
                      {item.eligibility_status && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            ELIGIBILITY_BADGE[item.eligibility_status] ||
                            "bg-ink-muted/15 text-ink-secondary"
                          }`}
                        >
                          {item.eligibility_status}
                        </span>
                      )}
                    </div>

                    {/* Package & Job Type Pills */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="rounded-md bg-emerald-500/12 px-2.5 py-1 font-semibold text-accent-emerald">
                        {formatPackageRange(item.package_min, item.package_max)}
                      </span>
                      {item.job_type && (
                        <span className="rounded-md border border-border-subtle bg-surface-input px-2.5 py-1 text-ink-secondary">
                          {item.job_type.replace(/_/g, " ")}
                        </span>
                      )}
                      {item.registration_status && (
                        <span className="rounded-md border border-border-subtle bg-surface-input px-2.5 py-1 text-ink-muted">
                          {item.registration_status}
                        </span>
                      )}
                    </div>

                    {/* Location & Deadline */}
                    <div className="mt-4 space-y-1.5 text-[11px] text-ink-secondary">
                      {item.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-ink-muted" />
                          <span>{item.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-ink-muted">
                        <Clock className="h-3.5 w-3.5 text-brand-400" />
                        <span>
                          Apply by {formatDeadline(item.application_deadline)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Action */}
                  <div className="mt-5 flex items-center justify-between border-t border-border-subtle/70 pt-3.5 text-[11px]">
                    <span className="text-ink-muted">
                      {applied && item.application_id
                        ? `App #${item.application_id}`
                        : `Reg #${item.registration_id}`}
                    </span>

                    {applied ? (
                      <button
                        type="button"
                        onClick={() => {
                          setFeedback(null);
                          setSelectedDrive(item);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-semibold text-accent-emerald transition hover:bg-emerald-500/20 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Details</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!canApply}
                        onClick={() => {
                          setFeedback(null);
                          setSelectedDrive(item);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-semibold transition ${
                          canApply
                            ? "bg-brand-500 text-white shadow-brand-glow hover:bg-brand-600 cursor-pointer"
                            : "cursor-not-allowed border border-border-subtle bg-surface-input text-ink-muted opacity-60"
                        }`}
                      >
                        {expired ? (
                          <span>Closed</span>
                        ) : !eligible ? (
                          <span>Not Eligible</span>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" />
                            <span>Apply Now</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Drive Detail & Resume Selection Apply Modal */}
      {/* Apply Modal for unapplied eligible drives */}
      <StudentDriveApplyModal
        drive={
          selectedDrive && !hasSubmittedApplication(selectedDrive)
            ? selectedDrive
            : null
        }
        onClose={() => setSelectedDrive(null)}
        onApplied={handleDriveApplied}
      />

      {/* Tracking Modal for already-applied drives */}
      <ApplicationTrackingModal
        driveItem={
          selectedDrive && hasSubmittedApplication(selectedDrive)
            ? selectedDrive
            : null
        }
        onClose={() => setSelectedDrive(null)}
      />
    </div>
  );
}
