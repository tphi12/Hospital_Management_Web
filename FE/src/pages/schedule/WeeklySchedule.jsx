import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { Button, Spin } from "antd";
import {
  CalendarOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { ROLES } from "../../lib/roles";
import { canManageKHTHSchedules, getEffectiveRoleCodes } from "../../lib/roleUtils";
import { useAuth } from "../../hooks/useAuth";
import {
  addWeeklyWorkItem,
  approveSchedule,
  createWeeklyWorkSchedule,
  deleteSchedule,
  deleteWeeklyWorkItem,
  getSchedules,
  getWeeklyWorkItemById,
  getWeeklyWorkItems,
  importWeeklyWorkItems,
  updateWeeklyWorkItem,
} from "../../modules/schedule/api/scheduleApi";
import api from "../../services/api";
import { UserPicker } from "../../components/UserPicker";
import { downloadSchedulePdf } from "../../modules/schedule/utils/downloadSchedulePdf";
import {
  ScheduleEmptyState,
  ScheduleInlineBadge,
  SchedulePageShell,
  SchedulePanel,
} from "../../modules/schedule/components/ScheduleWorkspace";

dayjs.extend(isoWeek);

const PERIOD_COLUMNS = [
  { key: "Sang", label: "Sang" },
  { key: "Chieu", label: "Chieu" },
  { key: "Dem", label: "Dem" },
];

const getPeriodKey = (value) => {
  if (value === "Chiều" || value === "Chieu") return "Chieu";
  if (value === "Đêm" || value === "Dem" || value === "night") return "Dem";
  return "Sang";
};

const getDateLabel = (value) => dayjs(value).format("DD/MM/YYYY");
const getDayLabel = (value) => dayjs(value).format("dddd");

function QueueCard({ title, description, badge, onOpen }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            {badge}
          </div>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
        <Button size="small" className="!rounded-full" onClick={onOpen}>Open</Button>
      </div>
    </div>
  );
}

function WeeklyItemCard({ item, participantLabel, canEdit, onEdit, onDelete }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{item.content}</p>
          {item.location ? <p className="mt-2 text-xs text-slate-500">{item.location}</p> : null}
          {participantLabel ? <p className="mt-2 text-xs text-slate-500">{participantLabel}</p> : null}
        </div>
        {canEdit ? (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onEdit(item.weekly_work_item_id)} className="text-xs font-medium text-slate-500 hover:text-slate-900">Sua</button>
            <button type="button" onClick={() => onDelete(item.weekly_work_item_id)} className="text-xs font-medium text-red-600 hover:text-red-700">Xoa</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function WeeklySchedule({ scheduleId }) {
  const { user } = useAuth();
  const effectiveRoleCodes = useMemo(() => getEffectiveRoleCodes(user), [user]);
  const canEdit = effectiveRoleCodes.has(ROLES.ADMIN) || canManageKHTHSchedules(user);

  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState(scheduleId || null);
  const [items, setItems] = useState([]);
  const [userLookup, setUserLookup] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const [deleteScheduleLoading, setDeleteScheduleLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [formData, setFormData] = useState({
    work_date: "",
    time_period: "Sáng",
    content: "",
    location: "",
    participantIds: [],
  });
  const fileInputRef = useRef(null);

  const selectedSchedule = schedules.find((item) => Number(item.schedule_id) === Number(selectedScheduleId));
  const draftSchedules = schedules.filter((item) => item.status === "draft");
  const publishedSchedules = schedules.filter((item) => item.status === "approved");

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSchedules({ schedule_type: "weekly_work" });
      if (!response.success) {
        setError(response.message || "Loi lay lich cong tac");
        return;
      }
      const list = Array.isArray(response.data) ? response.data : [];
      setSchedules(list);
      if (!list.length) {
        setSelectedScheduleId(null);
        setItems([]);
        return;
      }
      if (!list.some((item) => Number(item.schedule_id) === Number(selectedScheduleId || scheduleId))) {
        setSelectedScheduleId(list[0].schedule_id);
      }
    } finally {
      setLoading(false);
    }
  }, [scheduleId, selectedScheduleId]);

  const fetchItems = useCallback(async (targetId = selectedScheduleId || scheduleId) => {
    if (!targetId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await getWeeklyWorkItems(Number(targetId));
      if (!response.success) {
        setError(response.message || "Loi lay cong tac");
        return;
      }
      const nextItems = response.data || [];
      setItems(nextItems);

      const ids = [...new Set(nextItems.flatMap((item) => item.participantIds || []))];
      if (!ids.length) {
        setUserLookup({});
        return;
      }
      const picker = await api.get("/users/picker/by-ids", { params: { userIds: JSON.stringify(ids) } });
      const lookup = {};
      (picker.data.data || []).forEach((participant) => {
        lookup[participant.user_id] = participant;
      });
      setUserLookup(lookup);
    } finally {
      setLoading(false);
    }
  }, [scheduleId, selectedScheduleId]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    if (selectedScheduleId || scheduleId) fetchItems(selectedScheduleId || scheduleId);
  }, [fetchItems, scheduleId, selectedScheduleId]);

  const resetForm = () => {
    setFormData({ work_date: "", time_period: "Sáng", content: "", location: "", participantIds: [] });
    setEditingItemId(null);
    setShowForm(false);
  };

  const handleCreateSchedule = async () => {
    const now = dayjs();
    const response = await createWeeklyWorkSchedule({
      week: now.isoWeek(),
      year: now.year(),
      description: `Lich cong tac tuan ${now.isoWeek()} nam ${now.year()}`,
    });
    if (!response.success) {
      setError(response.message || "Loi tao lich moi");
      return;
    }
    await fetchSchedules();
  };

  const handleEditStart = async (itemId) => {
    const response = await getWeeklyWorkItemById(Number(selectedScheduleId), Number(itemId));
    if (!response.success) {
      setError(response.message || "Loi lay chi tiet cong tac");
      return;
    }
    const item = response.data;
    setFormData({
      work_date: item.work_date,
      time_period: item.time_period || "Sáng",
      content: item.content,
      location: item.location || "",
      participantIds: item.participantIds || [],
    });
    setEditingItemId(itemId);
    setShowForm(true);
  };

  const handleSaveItem = async (event) => {
    event.preventDefault();
    const payload = {
      work_date: formData.work_date,
      time_period: formData.time_period,
      content: formData.content,
      location: formData.location || null,
      participantIds: formData.participantIds.length ? formData.participantIds : null,
    };
    const response = editingItemId
      ? await updateWeeklyWorkItem(Number(selectedScheduleId), Number(editingItemId), payload)
      : await addWeeklyWorkItem({ schedule_id: Number(selectedScheduleId), ...payload });

    if (!response.success) {
      setError(response.message || "Khong the luu cong tac");
      return;
    }
    resetForm();
    await fetchItems(selectedScheduleId);
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Ban chac chan muon xoa cong tac nay?")) return;
    const response = await deleteWeeklyWorkItem(Number(selectedScheduleId), Number(itemId));
    if (!response.success) {
      setError(response.message || "Khong the xoa cong tac");
      return;
    }
    await fetchItems(selectedScheduleId);
  };

  const handleDeleteWeeklySchedule = async () => {
    if (!selectedSchedule?.schedule_id) return;
    if (!window.confirm("Ban chac chan muon xoa lich cong tac tuan nay?")) return;
    try {
      setDeleteScheduleLoading(true);
      const response = await deleteSchedule(Number(selectedSchedule.schedule_id));
      if (!response.success) {
        setError(response.message || "Khong the xoa lich cong tac tuan");
        return;
      }
      resetForm();
      setSelectedScheduleId(null);
      setItems([]);
      await fetchSchedules();
    } finally {
      setDeleteScheduleLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedSchedule?.schedule_id) return;
    if (!window.confirm("Publish weekly work schedule?")) return;
    try {
      setPublishLoading(true);
      const response = await approveSchedule(Number(selectedSchedule.schedule_id));
      if (!response.success) {
        setError(response.message || "Khong the dang lich");
        return;
      }
      await fetchSchedules();
      await fetchItems(selectedSchedule.schedule_id);
    } finally {
      setPublishLoading(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedScheduleId) return;
    try {
      setImportLoading(true);
      const response = await importWeeklyWorkItems(Number(selectedScheduleId), file);
      if (!response.success) {
        setError(response.message || "Import that bai");
        return;
      }
      await fetchItems(selectedScheduleId);
    } finally {
      setImportLoading(false);
      event.target.value = "";
    }
  };

  const handleExportPdf = async () => {
    if (!selectedSchedule) return;
    try {
      setExportLoading(true);
      const result = await downloadSchedulePdf({ ...selectedSchedule, schedule_type: "weekly_work" });
      if (!result.success) setError(result.message || "Khong the xuat PDF");
    } finally {
      setExportLoading(false);
    }
  };

  const scheduleMatrix = useMemo(() => {
    const matrix = new Map();
    [...items]
      .sort((a, b) => {
        const dateCompare = String(a.work_date).localeCompare(String(b.work_date));
        if (dateCompare !== 0) return dateCompare;
        return (PERIOD_COLUMNS.findIndex((item) => item.key === getPeriodKey(a.time_period))) -
          (PERIOD_COLUMNS.findIndex((item) => item.key === getPeriodKey(b.time_period)));
      })
      .forEach((item) => {
        const dateKey = String(item.work_date).slice(0, 10);
        if (!matrix.has(dateKey)) {
          matrix.set(dateKey, { date: dateKey, Sang: [], Chieu: [], Dem: [] });
        }
        matrix.get(dateKey)[getPeriodKey(item.time_period)].push(item);
      });
    return Array.from(matrix.values());
  }, [items]);

  const getParticipantNames = (item) =>
    item.participantNames || (item.participantIds || []).map((id) => userLookup[id]?.full_name).filter(Boolean).join(", ");

  return (
    <div data-testid="weekly-schedule-page">
      <SchedulePageShell
        minimal
        actions={
          <>
            <div className="flex min-w-[260px] items-center rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-600">
              <CalendarOutlined className="mr-2" />
              {selectedSchedule ? `Week ${selectedSchedule.week}/${selectedSchedule.year}` : "No schedule selected"}
            </div>
            <select
              value={selectedScheduleId || ""}
              onChange={(event) => setSelectedScheduleId(event.target.value ? Number(event.target.value) : null)}
              className="h-11 min-w-[260px] rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-slate-900"
            >
              <option value="">-- Chon lich --</option>
              {schedules.map((schedule) => (
                <option key={schedule.schedule_id} value={schedule.schedule_id}>
                  {`Week ${schedule.week}/${schedule.year} - ${schedule.status || "draft"}`}
                </option>
              ))}
            </select>
            <Button icon={<ReloadOutlined />} onClick={fetchSchedules} className="!h-11 !rounded-full !border-slate-200 !px-5">Refresh</Button>
            {canEdit ? (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateSchedule} className="!h-11 !rounded-full !border-0 !bg-slate-950 !px-5 !shadow-none hover:!bg-slate-800">
                Tao lich moi
              </Button>
            ) : null}
            <Button icon={<DownloadOutlined />} onClick={handleExportPdf} loading={exportLoading} disabled={!selectedSchedule} className="!h-11 !rounded-full !border-slate-200 !px-5">
              Export PDF
            </Button>
          </>
        }
      >
        {error ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div> : null}

        {canEdit ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <SchedulePanel title="Draft weekly schedules">
              <div className="space-y-3">
                {draftSchedules.length ? draftSchedules.map((schedule) => (
                  <QueueCard
                    key={schedule.schedule_id}
                    title={`Week ${schedule.week}/${schedule.year}`}
                    description={schedule.description || "Weekly work schedule in progress."}
                    badge={<ScheduleInlineBadge tone="warm">Draft</ScheduleInlineBadge>}
                    onOpen={() => setSelectedScheduleId(schedule.schedule_id)}
                  />
                )) : <ScheduleEmptyState title="No draft schedules" description="Create a new weekly work schedule to start filling the board." />}
              </div>
            </SchedulePanel>

            <SchedulePanel title="Published weekly schedules">
              <div className="space-y-3">
                {publishedSchedules.length ? publishedSchedules.map((schedule) => (
                  <QueueCard
                    key={schedule.schedule_id}
                    title={`Week ${schedule.week}/${schedule.year}`}
                    description={schedule.description || "Published weekly work schedule."}
                    badge={<ScheduleInlineBadge tone="success">Published</ScheduleInlineBadge>}
                    onOpen={() => setSelectedScheduleId(schedule.schedule_id)}
                  />
                )) : <ScheduleEmptyState title="No published schedules" description="Uploaded weekly schedules will appear here once KHTH publishes them." />}
              </div>
            </SchedulePanel>
          </div>
        ) : null}

        <SchedulePanel
          title="Weekly work workspace"
          actions={selectedSchedule ? (
            <div className="flex flex-wrap items-center gap-2">
              <ScheduleInlineBadge tone={selectedSchedule.status === "approved" ? "success" : "warm"}>
                {selectedSchedule.status === "approved" ? "Published" : "Draft"}
              </ScheduleInlineBadge>
              {canEdit ? (
                <>
                  {!showForm ? (
                    <Button icon={<PlusOutlined />} onClick={() => setShowForm(true)} className="!h-9 !rounded-full !border-slate-200 !px-4">Them cong tac</Button>
                  ) : (
                    <Button onClick={resetForm} className="!h-9 !rounded-full !border-slate-200 !px-4">Huy</Button>
                  )}
                  <Button icon={<UploadOutlined />} onClick={() => fileInputRef.current?.click()} loading={importLoading} className="!h-9 !rounded-full !border-slate-200 !px-4">Import</Button>
                  <input ref={fileInputRef} type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleImport} />
                  {selectedSchedule.status === "draft" ? (
                    <Button type="primary" onClick={handlePublish} loading={publishLoading} className="!h-9 !rounded-full !border-0 !bg-slate-950 !px-4 !shadow-none hover:!bg-slate-800">Upload weekly schedule</Button>
                  ) : null}
                  <Button danger icon={<DeleteOutlined />} onClick={handleDeleteWeeklySchedule} loading={deleteScheduleLoading} className="!h-9 !rounded-full !px-4">Xoa lich</Button>
                </>
              ) : null}
            </div>
          ) : null}
        >
          {loading ? (
            <div className="flex justify-center py-20"><Spin size="large" /></div>
          ) : !selectedSchedule ? (
            <ScheduleEmptyState title="No weekly schedule selected" description="Open or create a weekly work schedule to continue." />
          ) : (
            <div className="space-y-6">
              {showForm && canEdit ? (
                <form onSubmit={handleSaveItem} className="rounded-3xl border border-slate-200 bg-[#f7f6f3] p-5">
                  <div className="grid gap-4 md:grid-cols-3">
                    <input type="date" value={formData.work_date} onChange={(event) => setFormData({ ...formData, work_date: event.target.value })} className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-900" required />
                    <select value={formData.time_period} onChange={(event) => setFormData({ ...formData, time_period: event.target.value })} className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-900">
                      <option value="Sáng">Sáng</option>
                      <option value="Chiều">Chiều</option>
                    </select>
                    <input type="text" value={formData.location} onChange={(event) => setFormData({ ...formData, location: event.target.value })} className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-900" placeholder="Dia diem" />
                  </div>
                  <textarea value={formData.content} onChange={(event) => setFormData({ ...formData, content: event.target.value })} className="mt-4 min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900" required />
                  <div className="mt-4">
                    <UserPicker selectedUserIds={formData.participantIds} onUsersChange={(ids) => setFormData({ ...formData, participantIds: ids })} />
                  </div>
                  <div className="mt-5 flex justify-end gap-2">
                    <Button onClick={resetForm} className="!h-10 !rounded-full !border-slate-200 !px-4">Huy</Button>
                    <Button htmlType="submit" type="primary" className="!h-10 !rounded-full !border-0 !bg-slate-950 !px-4 !shadow-none hover:!bg-slate-800">{editingItemId ? "Cap nhat" : "Them"}</Button>
                  </div>
                </form>
              ) : null}

              {scheduleMatrix.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-[1080px] w-full border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className="sticky left-0 z-20 w-[220px] rounded-l-3xl border border-slate-200 bg-[#f7f6f3] px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Thu ngay</th>
                        {PERIOD_COLUMNS.map((column, index) => (
                          <th key={column.key} className={`border-y border-r border-slate-200 bg-[#f7f6f3] px-4 py-4 text-left text-sm font-semibold text-slate-700 ${index === PERIOD_COLUMNS.length - 1 ? "rounded-r-3xl" : ""}`}>
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {scheduleMatrix.map((row) => (
                        <tr key={row.date}>
                          <td className="sticky left-0 z-10 border-x border-b border-slate-200 bg-white px-4 py-5 align-top">
                            <p className="text-sm font-semibold text-slate-900">{getDayLabel(row.date)}</p>
                            <p className="mt-1 text-xs text-slate-500">{getDateLabel(row.date)}</p>
                          </td>
                          {PERIOD_COLUMNS.map((column) => (
                            <td key={`${row.date}-${column.key}`} className="border-r border-b border-slate-200 bg-white px-3 py-3 align-top">
                              {(row[column.key] || []).length ? (
                                <div className="space-y-3">
                                  {row[column.key].map((item) => (
                                    <WeeklyItemCard
                                      key={item.weekly_work_item_id}
                                      item={item}
                                      participantLabel={getParticipantNames(item)}
                                      canEdit={canEdit && selectedSchedule.status !== "approved"}
                                      onEdit={handleEditStart}
                                      onDelete={handleDeleteItem}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-300">Khong co cong tac</p>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <ScheduleEmptyState title="No weekly work items yet" description="Add a work item manually or import from a file to start populating the weekly board." />
              )}
            </div>
          )}
        </SchedulePanel>
      </SchedulePageShell>
    </div>
  );
}
