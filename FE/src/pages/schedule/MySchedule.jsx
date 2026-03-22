import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { CalendarDays, Clock3, MapPin, Search, UserRound } from "lucide-react";
import { getSchedules, getWeeklyWorkItems } from "../../modules/schedule/api/scheduleApi";

dayjs.locale("vi");

const DUTY_COLUMNS = [
  { key: "morning", label: "Sang" },
  { key: "afternoon", label: "Chieu" },
  { key: "night", label: "Dem" },
];

const WEEKLY_COLUMNS = [
  { key: "Sang", label: "Sang" },
  { key: "Chieu", label: "Chieu" },
  { key: "Dem", label: "Dem" },
];

const getWeeklyKey = (value) => {
  if (value === "Chiều" || value === "Chieu") return "Chieu";
  if (value === "Đêm" || value === "Dem" || value === "night") return "Dem";
  return "Sang";
};

function normalizeText(value) {
  return String(value ?? "").toLowerCase();
}

function formatDate(value) {
  return dayjs(value).format("DD/MM/YYYY");
}

function formatDay(value) {
  return dayjs(value).format("dddd");
}

function formatTimeRange(startTime, endTime) {
  return `${String(startTime ?? "").slice(0, 5)} - ${String(endTime ?? "").slice(0, 5)}`;
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400">
        <CalendarDays size={18} />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function ToneBadge({ children, tone = "neutral" }) {
  const toneClass = {
    neutral: "border-slate-200 bg-slate-50 text-slate-600",
    warm: "border-amber-200 bg-amber-50 text-amber-700",
    cool: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${toneClass[tone]}`}>
      {children}
    </span>
  );
}

function SectionCard({ title, children }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function DutyCard({ item }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <ToneBadge tone="cool">Lich truc</ToneBadge>
        <p className="text-sm font-semibold text-slate-900">{item.department_name ?? `Phong ${item.department_id}`}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Clock3 size={14} className="text-slate-400" />
          <span>{formatTimeRange(item.start_time, item.end_time)}</span>
        </div>
        <div className="flex items-center gap-2">
          <UserRound size={14} className="text-slate-400" />
          <span>{(item.assignments ?? []).map((assignment) => assignment.full_name ?? `#${assignment.user_id}`).join(", ") || "Chua co"}</span>
        </div>
      </div>
    </div>
  );
}

function WeeklyCard({ item }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <ToneBadge tone="warm">Cong tac tuan</ToneBadge>
        <p className="text-sm font-semibold text-slate-900">{item.content}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
        {item.location ? (
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-slate-400" />
            <span>{item.location}</span>
          </div>
        ) : null}
        {item.participantNames ? (
          <div className="flex items-center gap-2">
            <UserRound size={14} className="text-slate-400" />
            <span>{item.participantNames}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ScheduleTable({ rows, columns, renderCell, emptyText }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1080px] w-full border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="sticky left-0 z-20 w-[220px] rounded-l-3xl border border-slate-200 bg-[#f7f6f3] px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Thu ngay
            </th>
            {columns.map((column, index) => (
              <th
                key={column.key}
                className={`border-y border-r border-slate-200 bg-[#f7f6f3] px-4 py-4 text-left text-sm font-semibold text-slate-700 ${
                  index === columns.length - 1 ? "rounded-r-3xl" : ""
                }`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.date}>
              <td className="sticky left-0 z-10 border-x border-b border-slate-200 bg-white px-4 py-5 align-top">
                <p className="text-sm font-semibold text-slate-900">{formatDay(row.date)}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDate(row.date)}</p>
              </td>
              {columns.map((column) => (
                <td key={`${row.date}-${column.key}`} className="border-r border-b border-slate-200 bg-white px-3 py-3 align-top">
                  {(row[column.key] || []).length ? (
                    <div className="space-y-3">
                      {row[column.key].map((item) => renderCell(item))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300">{emptyText}</p>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MySchedule() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [dutyShifts, setDutyShifts] = useState([]);
  const [weeklyItems, setWeeklyItems] = useState([]);

  useEffect(() => {
    const fetchPublishedSchedules = async () => {
      try {
        setLoading(true);
        setError(null);

        const [approvedDutyRes, approvedWeeklyRes] = await Promise.all([
          getSchedules({ schedule_type: "duty", status: "approved" }),
          getSchedules({ schedule_type: "weekly_work", status: "approved" }),
        ]);

        if (!approvedDutyRes.success) throw new Error(approvedDutyRes.message ?? "Khong the tai lich truc");
        if (!approvedWeeklyRes.success) throw new Error(approvedWeeklyRes.message ?? "Khong the tai lich cong tac tuan");

        const nextDutyShifts = (approvedDutyRes.data ?? []).flatMap((schedule) => schedule.shifts ?? []);
        const weeklyScheduleIds = (approvedWeeklyRes.data ?? []).map((schedule) => schedule.schedule_id);
        const weeklyResponses = await Promise.all(weeklyScheduleIds.map((id) => getWeeklyWorkItems(id)));
        const nextWeeklyItems = weeklyResponses.filter((response) => response.success).flatMap((response) => response.data ?? []);

        setDutyShifts(nextDutyShifts);
        setWeeklyItems(nextWeeklyItems);
      } catch (fetchError) {
        setError(fetchError?.message ?? "Khong the tai du lieu lich da cong bo.");
        setDutyShifts([]);
        setWeeklyItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPublishedSchedules();
  }, []);

  const filteredDutyShifts = useMemo(() => {
    const query = normalizeText(search);
    return [...dutyShifts]
      .filter((item) => {
        if (!query) return true;
        return normalizeText([
          item.department_name,
          item.shift_type,
          item.shift_date,
          item.assignments?.map((assignment) => assignment.full_name).join(" "),
        ].join(" ")).includes(query);
      })
      .sort((left, right) => String(left.shift_date).localeCompare(String(right.shift_date)));
  }, [dutyShifts, search]);

  const filteredWeeklyItems = useMemo(() => {
    const query = normalizeText(search);
    return [...weeklyItems]
      .filter((item) => {
        if (!query) return true;
        return normalizeText([
          item.content,
          item.time_period,
          item.location,
          item.participantNames,
          item.work_date,
        ].join(" ")).includes(query);
      })
      .sort((left, right) => String(left.work_date).localeCompare(String(right.work_date)));
  }, [search, weeklyItems]);

  const dutyRows = useMemo(() => {
    const grouped = new Map();
    filteredDutyShifts.forEach((item) => {
      const date = String(item.shift_date).slice(0, 10);
      if (!grouped.has(date)) grouped.set(date, { date, morning: [], afternoon: [], night: [] });
      grouped.get(date)[item.shift_type || "morning"].push(item);
    });
    return Array.from(grouped.values());
  }, [filteredDutyShifts]);

  const weeklyRows = useMemo(() => {
    const grouped = new Map();
    filteredWeeklyItems.forEach((item) => {
      const date = String(item.work_date).slice(0, 10);
      if (!grouped.has(date)) grouped.set(date, { date, Sang: [], Chieu: [], Dem: [] });
      grouped.get(date)[getWeeklyKey(item.time_period)].push(item);
    });
    return Array.from(grouped.values());
  }, [filteredWeeklyItems]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f7f6f3]">
      <div className="mx-auto max-w-[1560px] px-5 py-5">
        <div className="rounded-[30px] border border-slate-200 bg-[#fcfbf8] shadow-sm">
          <div className="px-7 py-6">
            <div className="flex justify-end">
              <label className="relative w-full max-w-[360px]">
                <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tim theo phong ban, ca truc, noi dung cong tac"
                  className="h-11 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                />
              </label>
            </div>
          </div>

          <div className="space-y-5 border-t border-slate-200 px-7 py-6">
            {error ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {error}
              </div>
            ) : null}

            <div className="grid gap-5 xl:grid-cols-2">
              <SectionCard title="Lich truc da cong bo">
                {loading ? (
                  <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}</div>
                ) : !dutyRows.length ? (
                  <EmptyState title="Chua co lich truc da cong bo" description="Khi KHTH cong bo lich truc tong hop, danh sach se xuat hien tai day." />
                ) : (
                  <ScheduleTable
                    rows={dutyRows}
                    columns={DUTY_COLUMNS}
                    emptyText="Khong co ca truc"
                    renderCell={(item) => <DutyCard key={item.shift_id} item={item} />}
                  />
                )}
              </SectionCard>

              <SectionCard title="Lich cong tac tuan">
                {loading ? (
                  <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}</div>
                ) : !weeklyRows.length ? (
                  <EmptyState title="Chua co lich cong tac tuan" description="Khi KHTH dang lich cong tac tuan, noi dung se xuat hien tai day." />
                ) : (
                  <ScheduleTable
                    rows={weeklyRows}
                    columns={WEEKLY_COLUMNS}
                    emptyText="Khong co cong tac"
                    renderCell={(item) => <WeeklyCard key={item.weekly_work_item_id} item={item} />}
                  />
                )}
              </SectionCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
