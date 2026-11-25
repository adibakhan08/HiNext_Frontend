import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Briefcase,
  Clock,
  Bell,
  MapPin,
  Plus,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { axiosClient } from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import { Topbar } from '../../../components/layout/Topbar';
import { StatCard } from '../../../components/ui/StatCard';
import { CalendarEventModal } from './components/CalendarEventModal';

const EVENT_TYPE_CONFIG = {
  DRIVE: {
    label: 'Campus Drive',
    badge: 'bg-emerald-500/15 text-accent-emerald border-emerald-500/25',
    dot: 'bg-accent-emerald',
    calendarCell:
      'bg-emerald-500/15 text-accent-emerald ring-1 ring-emerald-500/40 hover:bg-emerald-500/25',
  },
  APPLICATION_OPEN: {
    label: 'Application Open',
    badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
    dot: 'bg-indigo-400',
    calendarCell:
      'bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/40 hover:bg-indigo-500/25',
  },
  APPLICATION_DEADLINE: {
    label: 'Deadline',
    badge: 'bg-red-500/15 text-red-400 border-red-500/25',
    dot: 'bg-red-400',
    calendarCell:
      'bg-red-500/15 text-red-300 ring-1 ring-red-500/40 hover:bg-red-500/25',
  },
  PPT: {
    label: 'PPT',
    badge: 'bg-sky-500/15 text-sky-400 border-sky-500/25',
    dot: 'bg-sky-400',
    calendarCell:
      'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/40 hover:bg-sky-500/25',
  },
  WORKSHOP: {
    label: 'Workshop',
    badge: 'bg-amber-500/15 text-accent-amber border-amber-500/25',
    dot: 'bg-accent-amber',
    calendarCell:
      'bg-amber-500/15 text-accent-amber ring-1 ring-amber-500/40 hover:bg-amber-500/25',
  },
  RESULTS: {
    label: 'Results',
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/25',
    dot: 'bg-purple-400',
    calendarCell:
      'bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/40 hover:bg-purple-500/25',
  },
  MEETING: {
    label: 'Meeting',
    badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
    dot: 'bg-cyan-400',
    calendarCell:
      'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/40 hover:bg-cyan-500/25',
  },
};

const FILTER_TABS = [
  { key: 'ALL', label: 'All Events' },
  { key: 'DRIVE', label: 'Campus Drive' },
  { key: 'APPLICATION_OPEN', label: 'Application Open' },
  { key: 'APPLICATION_DEADLINE', label: 'Deadline' },
  { key: 'PPT', label: 'PPT' },
  { key: 'WORKSHOP', label: 'Workshop' },
  { key: 'RESULTS', label: 'Results' },
  { key: 'MEETING', label: 'Meeting' },
];

const LEGEND_ITEMS = [
  { key: 'DRIVE', label: 'Drive' },
  { key: 'APPLICATION_OPEN', label: 'App Open' },
  { key: 'APPLICATION_DEADLINE', label: 'Deadline' },
  { key: 'WORKSHOP', label: 'Workshop' },
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getEventMeta(eventType) {
  return (
    EVENT_TYPE_CONFIG[eventType] || {
      label: eventType?.replace(/_/g, ' ') || 'Event',
      badge: 'bg-brand-500/15 text-brand-400 border-brand-500/25',
      dot: 'bg-brand-400',
      calendarCell:
        'bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/40 hover:bg-brand-500/25',
    }
  );
}

function CompanyBadge({ title }) {
  const prefix = (title || 'E').split('-')[0].trim();
  const initial = prefix.charAt(0).toUpperCase() || 'E';

  return (
    <div
      title={prefix}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-500/25 bg-brand-500/15 text-xs font-bold text-brand-400"
    >
      {initial}
    </div>
  );
}

export function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedDay, setSelectedDay] = useState(null);
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await axiosClient.get(API_ENDPOINTS.ADMIN.CALENDAR);
      const list = Array.isArray(data) ? data : data.results || [];
      setEvents(list);
      setTotalCount(data.count ?? list.length);

      if (list.length > 0 && list[0].start_datetime) {
        const firstDate = new Date(list[0].start_datetime);
        if (!Number.isNaN(firstDate.getTime())) {
          setCurrentMonthDate(
            new Date(firstDate.getFullYear(), firstDate.getMonth(), 1)
          );
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          'Failed to load calendar events.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const normalizedEvents = useMemo(() => {
    return events
      .filter((ev) => !ev.is_cancelled)
      .map((ev) => {
        const dt = ev.start_datetime ? new Date(ev.start_datetime) : null;
        const isValid = dt && !Number.isNaN(dt.getTime());

        const day = isValid ? String(dt.getDate()).padStart(2, '0') : '--';
        const month = isValid
          ? dt.toLocaleString('en-US', { month: 'short' })
          : '';
        const formattedTime = isValid
          ? dt.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })
          : '—';

        return {
          ...ev,
          parsedDate: isValid ? dt : null,
          day,
          dayNumber: isValid ? dt.getDate() : null,
          monthIndex: isValid ? dt.getMonth() : null,
          year: isValid ? dt.getFullYear() : null,
          month,
          formattedTime,
        };
      });
  }, [events]);

  const year = currentMonthDate.getFullYear();
  const monthIndex = currentMonthDate.getMonth();
  const monthTitle = currentMonthDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const filteredEvents = useMemo(() => {
    return normalizedEvents.filter((ev) => {
      if (selectedType !== 'ALL' && ev.event_type !== selectedType) {
        return false;
      }
      if (selectedDay !== null) {
        return (
          ev.dayNumber === selectedDay &&
          ev.monthIndex === monthIndex &&
          ev.year === year
        );
      }
      return true;
    });
  }, [normalizedEvents, selectedType, selectedDay, monthIndex, year]);

  const counts = useMemo(() => {
    return {
      total: totalCount || normalizedEvents.length,
      drives: normalizedEvents.filter((e) => e.event_type === 'DRIVE').length,
      appWindows: normalizedEvents.filter(
        (e) => e.event_type === 'APPLICATION_OPEN'
      ).length,
      deadlines: normalizedEvents.filter(
        (e) => e.event_type === 'APPLICATION_DEADLINE'
      ).length,
    };
  }, [normalizedEvents, totalCount]);

  // Map each day in the active month/year to its matching events so the grid can color-code cells & dots
  const eventsByDayInMonth = useMemo(() => {
    const map = new Map();
    normalizedEvents.forEach((ev) => {
      if (ev.year === year && ev.monthIndex === monthIndex && ev.dayNumber) {
        const existing = map.get(ev.dayNumber) || [];
        existing.push(ev);
        map.set(ev.dayNumber, existing);
      }
    });
    return map;
  }, [normalizedEvents, year, monthIndex]);

  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const calendarCells = useMemo(() => {
    const cells = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [firstDayOfWeek, daysInMonth]);

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, monthIndex - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, monthIndex + 1, 1));
    setSelectedDay(null);
  };

  return (
    <div className="flex flex-1 flex-col">
      <Topbar
        title="Calendar"
        subtitle="Upcoming events, drive dates, and application deadlines"
      />

      <main className="flex-1 space-y-6 p-7">
        {/* Top 4 KPI Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={CalendarIcon}
            value={counts.total}
            label="Total Events"
            accent="indigo"
          />
          <StatCard
            icon={Briefcase}
            value={counts.drives}
            label="Campus Drives"
            accent="emerald"
          />
          <StatCard
            icon={Clock}
            value={counts.appWindows}
            label="Application Windows"
            accent="amber"
          />
          <StatCard
            icon={Bell}
            value={counts.deadlines}
            label="Deadlines"
            accent="violet"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Main 2-Column Layout: Event Feed (Left) + Color-Coded Mini Calendar & Upcoming (Right) */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
          {/* Left Column: Filter Pills + Event Cards */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {FILTER_TABS.map(({ key, label }) => {
                  const isActive = selectedType === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSelectedType(key);
                        setSelectedDay(null);
                      }}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                        isActive
                          ? 'bg-brand-500 text-white shadow-brand-glow'
                          : 'border border-border-subtle bg-surface-card text-ink-secondary hover:bg-surface-elevated hover:text-ink-primary'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingEvent(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-input px-3 py-1.5 text-xs font-medium text-ink-primary transition hover:border-brand-500/40 hover:bg-surface-elevated cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-brand-400" />
                <span>Add Event</span>
              </button>
            </div>

            {selectedDay !== null && (
              <div className="flex items-center justify-between rounded-xl border border-brand-500/25 bg-brand-900/20 px-4 py-2 text-xs">
                <span className="text-ink-secondary">
                  Showing events on{' '}
                  <strong className="text-brand-400">
                    {monthTitle.split(' ')[0]} {selectedDay}, {year}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="font-medium text-brand-400 hover:underline cursor-pointer"
                >
                  Clear day filter
                </button>
              </div>
            )}

            {/* Event List */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="rounded-xl border border-border-subtle bg-surface-card p-10 text-center text-xs text-ink-muted">
                  Loading calendar events...
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="rounded-xl border border-border-subtle bg-surface-card p-10 text-center text-xs text-ink-muted">
                  No scheduled events match this filter.
                </div>
              ) : (
                filteredEvents.map((ev) => {
                  const meta = getEventMeta(ev.event_type);

                  return (
                    <div
                      key={ev.id}
                      onClick={() => {
                        setEditingEvent(ev);
                        setIsModalOpen(true);
                      }}
                      className="flex items-center justify-between gap-4 rounded-xl border border-border-subtle bg-surface-card px-5 py-4 transition hover:border-brand-500/35 hover:bg-surface-elevated/30 cursor-pointer"
                    >
                      <div className="flex min-w-0 items-center gap-5">
                        {/* Left Date Block */}
                        <div className="w-10 shrink-0 text-center">
                          <div className="text-base font-bold leading-tight text-ink-primary">
                            {ev.day}
                          </div>
                          <div className="mt-0.5 text-[11px] font-medium text-ink-muted">
                            {ev.month}
                          </div>
                        </div>

                        {/* Event Title, Category Badge & Metadata */}
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="truncate text-sm font-semibold text-ink-primary">
                              {ev.title}
                            </span>

                            <span
                              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${meta.badge}`}
                            >
                              {meta.label}
                            </span>

                            {ev.is_auto_generated && (
                              <span
                                title="Auto-generated from placement drive"
                                className="inline-flex items-center gap-1 rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] font-medium text-ink-muted"
                              >
                                <Sparkles className="h-2.5 w-2.5 text-brand-400" />
                                Drive #{ev.drive}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-[11px] text-ink-muted">
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3 text-accent-rose" />
                              <span>{ev.formattedTime}</span>
                            </span>

                            {ev.location && (
                              <span className="flex items-center gap-1.5">
                                <MapPin className="h-3 w-3 text-pink-400" />
                                <span>{ev.location}</span>
                              </span>
                            )}

                            {ev.meeting_link && (
                              <a
                                href={ev.meeting_link}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 text-brand-400 hover:underline"
                              >
                                <span>Join link</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Company Initial Badge */}
                      <CompanyBadge title={ev.title} />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Color-Coded Mini Month Grid + Upcoming Schedule */}
          <div className="space-y-5">
            {/* Monthly Mini Calendar */}
            <div className="rounded-xl border border-border-subtle bg-surface-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ink-primary">
                  {monthTitle}
                </h2>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="rounded-lg p-1 text-ink-muted transition hover:bg-surface-elevated hover:text-ink-primary cursor-pointer"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="rounded-lg p-1 text-ink-muted transition hover:bg-surface-elevated hover:text-ink-primary cursor-pointer"
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-ink-muted">
                {WEEKDAYS.map((wd) => (
                  <div key={wd} className="py-1">
                    {wd}
                  </div>
                ))}
              </div>

              <div className="mt-1 grid grid-cols-7 gap-1.5 text-center text-xs">
                {calendarCells.map((dayNum, idx) => {
                  if (!dayNum) {
                    return <div key={`empty-${idx}`} className="h-9" />;
                  }

                  const dayEvents = eventsByDayInMonth.get(dayNum) || [];
                  const hasEvent = dayEvents.length > 0;
                  const primaryMeta = hasEvent
                    ? getEventMeta(dayEvents[0].event_type)
                    : null;
                  const isSelected = selectedDay === dayNum;

                  const tooltipText = hasEvent
                    ? dayEvents.map((e) => e.title).join(' • ')
                    : undefined;

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      title={tooltipText}
                      onClick={() =>
                        setSelectedDay((prev) => (prev === dayNum ? null : dayNum))
                      }
                      className={`relative flex h-9 w-full flex-col items-center justify-center rounded-lg text-xs font-medium transition cursor-pointer ${
                        isSelected
                          ? 'bg-brand-500 text-white font-bold shadow-brand-glow'
                          : hasEvent
                          ? `${primaryMeta.calendarCell} font-semibold`
                          : 'text-ink-secondary hover:bg-surface-input hover:text-ink-primary'
                      }`}
                    >
                      <span className="leading-none">{dayNum}</span>

                      {/* Colored Event Indicator Dots */}
                      {hasEvent && (
                        <span className="mt-1 flex items-center gap-0.5">
                          {dayEvents.slice(0, 3).map((ev, i) => {
                            const dotColor = isSelected
                              ? 'bg-white'
                              : getEventMeta(ev.event_type).dot;
                            return (
                              <span
                                key={ev.id || i}
                                className={`h-1 w-1 rounded-full ${dotColor}`}
                              />
                            );
                          })}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Color Legend */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3 text-[10px] text-ink-muted">
                {LEGEND_ITEMS.map(({ key, label }) => {
                  const meta = getEventMeta(key);
                  return (
                    <span key={key} className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                      <span>{label}</span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Upcoming Events Widget */}
            <div className="rounded-xl border border-border-subtle bg-surface-card p-5">
              <h2 className="mb-4 text-sm font-semibold text-ink-primary">
                Upcoming Events
              </h2>

              {normalizedEvents.length === 0 ? (
                <p className="text-xs text-ink-muted">No upcoming events.</p>
              ) : (
                <div className="space-y-3.5">
                  {normalizedEvents.slice(0, 5).map((ev) => {
                    const meta = getEventMeta(ev.event_type);
                    return (
                      <div key={ev.id} className="flex items-start gap-3">
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${meta.dot}`}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-ink-primary">
                            {ev.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-ink-muted">
                            {ev.month} {ev.day} · {ev.formattedTime}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <CalendarEventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        event={editingEvent}
        onSaved={fetchEvents}
      />
    </div>
  );
}