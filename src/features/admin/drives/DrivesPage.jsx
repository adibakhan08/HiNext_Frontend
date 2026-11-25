import { useCallback, useEffect, useState } from "react";
import {
  Briefcase,
  Plus,
  Search,
  Calendar,
  Users,
  Award,
  Pencil,
  Trash2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { axiosClient } from "../../../api/axiosClient";
import { API_ENDPOINTS } from "../../../api/endpoints";
import { Topbar } from "../../../components/layout/Topbar";
import { StatCard } from "../../../components/ui/StatCard";
import { DriveFormModal } from "./components/DriveFormModal";
import { DriveEligibilityModal } from "./components/DriveEligibilityModal";
import { EditDriveModal } from "./components/EditDriveModal";

const STATUS_BADGE = {
  OPEN: "bg-emerald-500/15 text-accent-emerald",
  ONGOING: "bg-emerald-500/15 text-accent-emerald",
  UPCOMING: "bg-indigo-500/15 text-indigo-400",
  CLOSED: "bg-amber-500/15 text-accent-amber",
  COMPLETED: "bg-ink-muted/15 text-ink-secondary",
};

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

function formatDate(isoStr) {
  if (!isoStr) return "—";
  return new Date(isoStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function DrivesPage() {
  const [drives, setDrives] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDrive, setEditingDrive] = useState(null);
  const [eligibilityDrive, setEligibilityDrive] = useState(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDriveForEligibility, setNewDriveForEligibility] = useState(null);

  const [editModalState, setEditModalState] = useState({
    isOpen: false,
    drive: null,
    initialTab: "DETAILS",
  });

  const fetchDrives = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await axiosClient.get(API_ENDPOINTS.ADMIN.DRIVES);
      const list = Array.isArray(data) ? data : data.results || [];
      setDrives(list);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to load placement drives.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDriveSaved = (savedDrive, wasEditing) => {
    fetchDrives();
    if (!wasEditing && savedDrive?.id) {
      setEligibilityDrive(savedDrive);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  const handleOpenCreate = () => {
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (drive, tab = "DETAILS") => {
    setEditModalState({
      isOpen: true,
      drive,
      initialTab: tab,
    });
  };

  const handleCreatedDrive = (createdDrive) => {
    fetchDrives();
    if (createdDrive?.id) {
      setNewDriveForEligibility(createdDrive);
    }
  };

  const handleDelete = async (drive) => {
    const label = drive.title || drive.job_role || `Drive #${drive.id}`;
    if (!window.confirm(`Delete "${label}"?`)) return;

    try {
      await axiosClient.delete(API_ENDPOINTS.ADMIN.DRIVE_DETAIL(drive.id));
      setDrives((prev) => prev.filter((d) => d.id !== drive.id));
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          `Unable to delete ${label}.`,
      );
    }
  };

  const filteredDrives = drives.filter((d) => {
    const driveStatus = d.status || "OPEN";
    if (statusFilter !== "ALL" && driveStatus !== statusFilter) return false;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    const companyName = (d.company?.name || d.company_name || "").toLowerCase();

    return (
      (d.title || "").toLowerCase().includes(q) ||
      (d.job_role || "").toLowerCase().includes(q) ||
      companyName.includes(q) ||
      (d.location || "").toLowerCase().includes(q)
    );
  });

  const openCount = drives.filter(
    (d) => d.status === "OPEN" || d.status === "ONGOING",
  ).length;

  const totalOpenings = drives.reduce(
    (sum, d) => sum + (Number(d.openings) || 0),
    0,
  );

  const highestMaxPkg = drives.reduce((max, d) => {
    const val = parseFloat(d.package_max || d.package_min) || 0;
    return val > max ? val : max;
  }, 0);

  return (
    <div className="flex flex-1 flex-col">
      <Topbar
        title="Placement Drives"
        subtitle="Schedule campus hiring drives, manage openings, and track deadlines"
      />
      <main className="flex-1 space-y-6 p-7">
        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Briefcase}
            badgeText="Season"
            value={drives.length}
            label="Total Drives"
            caption="Scheduled across all companies"
            accent="indigo"
          />

          <StatCard
            icon={Calendar}
            badgeText="Live"
            value={openCount}
            label="Open Drives"
            caption="Accepting student applications"
            accent="emerald"
          />

          <StatCard
            icon={Users}
            badgeText="Seats"
            value={totalOpenings}
            label="Total Openings"
            caption="Positions across active drives"
            accent="amber"
          />

          <StatCard
            icon={Award}
            badgeText="Top CTC"
            value={
              highestMaxPkg > 0
                ? highestMaxPkg >= 10000
                  ? `${(highestMaxPkg / 100000).toFixed(1)} LPA`
                  : `${highestMaxPkg} LPA`
                : "—"
            }
            label="Highest Max Package"
            caption="Across registered drives"
            accent="violet"
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-1 min-w-[260px] flex-wrap items-center gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, role, company, location..."
                className="w-full rounded-lg border border-border-subtle bg-surface-input py-2 pl-9 pr-3.5 text-xs text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border-subtle bg-surface-input p-1">
              {["ALL", "OPEN", "UPCOMING", "CLOSED", "COMPLETED"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
                    statusFilter === st
                      ? "bg-brand-500 text-white"
                      : "text-ink-secondary hover:text-ink-primary"
                  }`}
                >
                  {st === "ALL" ? "All Drives" : st}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-xs font-semibold text-white shadow-brand-glow transition hover:bg-brand-600 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create Drive</span>
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Drives Table */}
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-card">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-input/60 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  <th className="px-5 py-3.5">Drive & Role</th>
                  <th className="px-5 py-3.5">Company</th>
                  <th className="px-5 py-3.5">Package & Openings</th>
                  <th className="px-5 py-3.5">Schedule</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border-subtle/70 text-xs">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-ink-muted"
                    >
                      Loading placement drives...
                    </td>
                  </tr>
                ) : filteredDrives.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-14 text-center text-ink-muted"
                    >
                      No placement drives found. Click &ldquo;Create
                      Drive&rdquo; to schedule one.
                    </td>
                  </tr>
                ) : (
                  filteredDrives.map((drive) => {
                    const companyName =
                      drive.company?.name ||
                      drive.company_name ||
                      (drive.company ? `Company #${drive.company}` : "—");
                    const driveStatus = drive.status || "OPEN";

                    return (
                      <tr
                        key={drive.id}
                        className="transition hover:bg-surface-elevated/40"
                      >
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-ink-primary">
                            {drive.title || drive.job_role}
                          </p>
                          <p className="mt-0.5 text-[11px] text-ink-secondary">
                            {drive.job_role}
                            {drive.job_type
                              ? ` · ${drive.job_type.replace("_", " ")}`
                              : ""}
                            {drive.location ? ` · ${drive.location}` : ""}
                          </p>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/12 text-[11px] font-bold text-accent-amber">
                              {companyName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-ink-primary">
                              {companyName}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="inline-flex rounded-full bg-emerald-500/12 px-2.5 py-0.5 text-[11px] font-semibold text-accent-emerald">
                            {formatPackageRange(
                              drive.package_min,
                              drive.package_max,
                            )}
                          </span>
                          {drive.openings != null && (
                            <p className="mt-1 text-[11px] text-ink-muted">
                              {drive.openings} openings
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="space-y-1 text-[11px] text-ink-secondary">
                            {drive.drive_date && (
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-brand-400" />
                                <span>
                                  Drive: {formatDate(drive.drive_date)}
                                </span>
                              </div>
                            )}
                            {drive.application_deadline && (
                              <div className="flex items-center gap-1.5 text-ink-muted">
                                <Clock className="h-3 w-3" />
                                <span>
                                  Deadline:{" "}
                                  {formatDate(drive.application_deadline)}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              STATUS_BADGE[driveStatus] || STATUS_BADGE.OPEN
                            }`}
                          >
                            {driveStatus}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            {/* <button
                              type="button"
                              onClick={() => handleOpenEdit(drive)}
                              className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-input px-2.5 py-1.5 text-[11px] font-medium text-ink-secondary transition hover:border-brand-500/40 hover:text-brand-400 cursor-pointer"
                            >
                              <Pencil className="h-3 w-3" />
                              <span>Edit</span>
                            </button> */}
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenEdit(drive, "ELIGIBILITY")
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-input px-2.5 py-1.5 text-[11px] font-medium text-ink-secondary transition hover:border-emerald-500/40 hover:text-accent-emerald cursor-pointer"
                            >
                              <ShieldCheck className="h-3 w-3" />
                              <span>Eligibility</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(drive, "DETAILS")}
                              className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-input px-2.5 py-1.5 text-[11px] font-medium text-ink-secondary transition hover:border-brand-500/40 hover:text-brand-400 cursor-pointer"
                            >
                              <Pencil className="h-3 w-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(drive)}
                              className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-input px-2.5 py-1.5 text-[11px] font-medium text-ink-secondary transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      {/* Step 1: Create New Drive */}
      <DriveFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSaved={handleCreatedDrive}
      />
      {/* Step 2: Add Eligibility immediately after Create */}
      <DriveEligibilityModal
        isOpen={Boolean(newDriveForEligibility)}
        onClose={() => setNewDriveForEligibility(null)}
        drive={newDriveForEligibility}
        onSaved={fetchDrives}
      />
      {/* Tabbed Edit Modal (Drive Details + Eligibility Criteria) */}
      <EditDriveModal
        isOpen={editModalState.isOpen}
        onClose={() =>
          setEditModalState({
            isOpen: false,
            drive: null,
            initialTab: "DETAILS",
          })
        }
        drive={editModalState.drive}
        initialTab={editModalState.initialTab}
        onSaved={fetchDrives}
      />
    </div>
  );
}
