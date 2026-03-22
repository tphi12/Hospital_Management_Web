import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Empty,
  Form,
  InputNumber,
  Modal,
  Select,
  Spin,
  TimePicker,
  message,
} from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { isoWeeksInYear, weekDays } from "../../modules/schedule/utils/calendar";
import { useAuth } from "../../hooks/useAuth";
import {
  addShift,
  deleteSchedule,
  deleteShift,
  exportMasterDutySchedulePdf,
  getSchedulesByWeek,
  updateShift,
} from "../../modules/schedule/api/scheduleApi";
import { downloadSchedulePdf } from "../../modules/schedule/utils/downloadSchedulePdf";
import { useApproveScheduleMutation } from "../../modules/schedule/hooks/useScheduleQuery";
import ScheduleTable from "../../modules/schedule/components/ScheduleTable";
import {
  ScheduleEmptyState,
  ScheduleInlineBadge,
  SchedulePageShell,
  SchedulePanel,
} from "../../modules/schedule/components/ScheduleWorkspace";

dayjs.extend(isoWeek);

const { Option } = Select;

const STATUS_TONE = {
  draft: "neutral",
  submitted: "warm",
  approved: "success",
};

const STATUS_LABEL = {
  draft: "Draft",
  submitted: "Cho duyet",
  approved: "Da cong bo",
};

function normaliseDate(value) {
  return (typeof value === "string" ? value : dayjs(value).format("YYYY-MM-DD")).slice(0, 10);
}

function fmtTime(value) {
  return value ? String(value).slice(0, 5) : "--:--";
}

function ReviewQueueCard({ item, actions, tone = "neutral" }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">
              {item.source_department_name ?? `Phong ${item.source_department_id}`}
            </p>
            <ScheduleInlineBadge tone={tone}>{STATUS_LABEL[item.status] ?? item.status}</ScheduleInlineBadge>
          </div>
          <p className="mt-2 text-sm text-slate-500">Tuan {item.week}/{item.year}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      </div>
    </div>
  );
}

function ReadOnlyShiftCard({ shift }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            {shift.shift_type}
          </span>
          <div className="mt-2 text-xs text-slate-500">{fmtTime(shift.start_time)} - {fmtTime(shift.end_time)}</div>
        </div>
      </div>

      {shift.department_name ? <p className="mt-3 text-xs text-slate-500">{shift.department_name}</p> : null}
      <div className="mt-3 text-xs text-slate-500">
        {(shift.assignments ?? []).length}/{shift.max_staff} nguoi
      </div>

      {shift.assignments?.length ? (
        <div className="mt-3 space-y-1.5 border-t border-slate-200 pt-3">
          {shift.assignments.map((assignment) => (
            <div key={assignment.assignment_id} className="truncate text-xs text-slate-600">
              {assignment.full_name ?? `#${assignment.user_id}`}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MasterMergedScheduleTable({ schedule, days }) {
  const departments = Array.from(
    new Map(
      (schedule?.shifts ?? []).map((shift) => [
        shift.department_id,
        {
          id: shift.department_id,
          name: shift.department_name ?? `Phong ${shift.department_id}`,
        },
      ]),
    ).values(),
  );

  const shiftsByKey = new Map();
  for (const shift of schedule?.shifts ?? []) {
    const key = `${normaliseDate(shift.shift_date)}::${shift.department_id}`;
    if (!shiftsByKey.has(key)) shiftsByKey.set(key, []);
    shiftsByKey.get(key).push(shift);
  }

  if (!departments.length) {
    return (
      <ScheduleEmptyState
        title="Chua co lich truc tong hop"
        description="Lich truc da cong bo cua cac phong ban se xuat hien tai day."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1080px] w-full border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="sticky left-0 z-20 w-[150px] rounded-l-3xl border border-slate-200 bg-[#f7f6f3] px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Ngay
            </th>
            {departments.map((department, index) => (
              <th
                key={department.id}
                className={`border-y border-r border-slate-200 bg-[#f7f6f3] px-4 py-4 text-left text-sm font-semibold text-slate-700 ${
                  index === departments.length - 1 ? "rounded-r-3xl" : ""
                }`}
              >
                {department.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => {
            const date = day.format("YYYY-MM-DD");

            return (
              <tr key={date}>
                <td className="sticky left-0 z-10 border-x border-b border-slate-200 bg-white px-4 py-5 align-top">
                  <p className="text-sm font-semibold text-slate-900">{day.format("DD/MM/YYYY")}</p>
                  <p className="mt-1 text-xs text-slate-500">{day.format("dddd")}</p>
                </td>
                {departments.map((department) => {
                  const shifts = shiftsByKey.get(`${date}::${department.id}`) ?? [];

                  return (
                    <td key={`${date}-${department.id}`} className="border-r border-b border-slate-200 bg-white px-3 py-3 align-top">
                      {shifts.length ? (
                        <div className="space-y-2">
                          {shifts.map((shift) => (
                            <ReadOnlyShiftCard key={shift.shift_id} shift={shift} />
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-300">Khong co ca truc</p>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function DutyScheduleKHTHPage() {
  const { user } = useAuth();
  const approveMutation = useApproveScheduleMutation();
  const [shiftForm] = Form.useForm();
  const [currentWeek, setCurrentWeek] = useState(() => dayjs().isoWeek());
  const [currentYear, setCurrentYear] = useState(() => dayjs().year());
  const [schedules, setSchedules] = useState([]);
  const [reviewScheduleId, setReviewScheduleId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [savingShift, setSavingShift] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState(false);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [activeDate, setActiveDate] = useState(null);

  const days = weekDays(currentWeek, currentYear);
  const weekRangeLabel = `${days[0].format("DD/MM/YYYY")} - ${days[6].format("DD/MM/YYYY")}`;

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getSchedulesByWeek(currentWeek, currentYear, "duty");
      if (!response.success) {
        setSchedules([]);
        setReviewScheduleId(null);
        return;
      }

      const nextSchedules = (response.data ?? []).filter(
        (item) => item.status === "submitted" || item.status === "approved",
      );
      setSchedules(nextSchedules);
      setReviewScheduleId((previous) => {
        if (previous && nextSchedules.some((item) => item.schedule_id === previous)) return previous;
        return nextSchedules.find((item) => item.status === "submitted")?.schedule_id ?? nextSchedules[0]?.schedule_id ?? null;
      });
    } catch {
      setSchedules([]);
      setReviewScheduleId(null);
    } finally {
      setLoading(false);
    }
  }, [currentWeek, currentYear]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const approvedSchedules = schedules.filter((item) => item.status === "approved");
  const submittedSchedules = schedules.filter((item) => item.status === "submitted");
  const reviewSchedule = schedules.find((item) => item.schedule_id === reviewScheduleId)
    ?? submittedSchedules[0]
    ?? approvedSchedules[0]
    ?? null;

  const mergedApprovedSchedule = approvedSchedules.length
    ? {
        schedule_id: `master-${currentWeek}-${currentYear}`,
        week: currentWeek,
        year: currentYear,
        status: "approved",
        owner_department_name: "KHTH",
        source_department_name: "Toan vien",
        is_master: true,
        shifts: approvedSchedules.flatMap((item) => item.shifts ?? []),
      }
    : null;

  const canMutateSelectedSchedule = Boolean(
    reviewSchedule &&
    (reviewSchedule.status === "submitted" || reviewSchedule.status === "approved"),
  );

  const openEditShift = (shift) => {
    setEditingShift(shift);
    setActiveDate(normaliseDate(shift.shift_date));
    shiftForm.setFieldsValue({
      shift_type: shift.shift_type,
      start_time: dayjs(String(shift.start_time).slice(0, 5), "HH:mm"),
      end_time: dayjs(String(shift.end_time).slice(0, 5), "HH:mm"),
      max_staff: shift.max_staff,
    });
    setShiftModalOpen(true);
  };

  const openAddShift = (dateStr) => {
    if (!reviewSchedule?.schedule_id) return;
    setEditingShift(null);
    setActiveDate(dateStr);
    shiftForm.resetFields();
    setShiftModalOpen(true);
  };

  const closeShiftModal = () => {
    setShiftModalOpen(false);
    setEditingShift(null);
    setActiveDate(null);
    shiftForm.resetFields();
  };

  const handleSaveShift = async () => {
    if (!reviewSchedule?.schedule_id || !activeDate) return;

    let values;
    try {
      values = await shiftForm.validateFields();
    } catch {
      return;
    }

    const payload = {
      shift_date: activeDate,
      shift_type: values.shift_type,
      start_time: values.start_time.format("HH:mm"),
      end_time: values.end_time.format("HH:mm"),
      max_staff: values.max_staff,
    };

    try {
      setSavingShift(true);
      const response = editingShift?.shift_id
        ? await updateShift(editingShift.shift_id, payload)
        : await addShift({
            schedule_id: reviewSchedule.schedule_id,
            department_id: reviewSchedule.source_department_id,
            ...payload,
          });

      if (!response?.success) {
        message.error(response?.message ?? "Luu ca truc that bai");
        return;
      }

      message.success(editingShift ? "Cap nhat ca truc thanh cong" : "Them ca truc thanh cong");
      closeShiftModal();
      fetchSchedules();
    } catch (error) {
      message.error(error?.message ?? "Luu ca truc that bai");
    } finally {
      setSavingShift(false);
    }
  };

  const handleDeleteShift = async (shift) => {
    if (!shift?.shift_id || !window.confirm("Ban co chac muon xoa ca truc nay?")) return;

    try {
      const response = await deleteShift(shift.shift_id);
      if (!response.success) {
        message.error(response.message ?? "Xoa ca truc that bai");
        return;
      }
      message.success("Xoa ca truc thanh cong");
      fetchSchedules();
    } catch (error) {
      message.error(error?.message ?? "Xoa ca truc that bai");
    }
  };

  const handleDeleteSchedule = async () => {
    if (!reviewSchedule?.schedule_id || !window.confirm("Ban co chac muon xoa lich truc nay?")) return;

    try {
      setDeletingSchedule(true);
      const response = await deleteSchedule(reviewSchedule.schedule_id);
      if (!response.success) {
        message.error(response.message ?? "Xoa lich that bai");
        return;
      }
      message.success("Xoa lich truc thanh cong");
      fetchSchedules();
    } catch (error) {
      message.error(error?.message ?? "Xoa lich that bai");
    } finally {
      setDeletingSchedule(false);
    }
  };

  const handleApproveSchedule = async (scheduleId) => {
    try {
      await approveMutation.mutateAsync(scheduleId);
      fetchSchedules();
    } catch {
      // toast handled by mutation
    }
  };

  const handleExportPdf = async () => {
    if (!mergedApprovedSchedule) return;
    setExporting(true);

    try {
      const response = await exportMasterDutySchedulePdf(currentWeek, currentYear);
      if (!response.success || !response.data) {
        message.error(response.message ?? "Xuat PDF that bai");
        return;
      }

      const filename = `Master_Duty_Schedule_Week_${currentWeek}_${currentYear}.pdf`;
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      message.success(`Da tai xuong ${filename}`);
    } finally {
      setExporting(false);
    }
  };

  const openApprovedPdf = async () => {
    if (!reviewSchedule?.schedule_id || reviewSchedule.status !== "approved") return;
    const result = await downloadSchedulePdf(reviewSchedule);
    if (!result.success) {
      message.error(result.message ?? "Xuat PDF that bai");
    }
  };

  return (
    <div data-testid="duty-khth-page">
      <Spin spinning={savingShift || deletingSchedule} fullscreen tip="Dang xu ly..." />

      <SchedulePageShell
        minimal
        actions={
          <>
            <div className="flex h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-600">
              <CalendarOutlined className="mr-2" />
              {weekRangeLabel}
            </div>
            <Button icon={<LeftOutlined />} onClick={() => {
              if (currentWeek === 1) {
                setCurrentYear((value) => value - 1);
                setCurrentWeek(isoWeeksInYear(currentYear - 1));
                return;
              }
              setCurrentWeek((value) => value - 1);
            }} className="!h-11 !rounded-full !border-slate-200 !px-4">
              Prev
            </Button>
            <Button onClick={() => {
              setCurrentWeek(dayjs().isoWeek());
              setCurrentYear(dayjs().year());
            }} className="!h-11 !rounded-full !border-slate-200 !px-4">
              Current
            </Button>
            <Button icon={<RightOutlined />} onClick={() => {
              if (currentWeek >= isoWeeksInYear(currentYear)) {
                setCurrentYear((value) => value + 1);
                setCurrentWeek(1);
                return;
              }
              setCurrentWeek((value) => value + 1);
            }} className="!h-11 !rounded-full !border-slate-200 !px-4">
              Next
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportPdf}
              loading={exporting}
              disabled={!mergedApprovedSchedule}
              className="!h-11 !rounded-full !border-slate-200 !px-5"
            >
              PDF tong hop
            </Button>
            {reviewSchedule?.status === "approved" ? (
              <Button
                icon={<DownloadOutlined />}
                onClick={openApprovedPdf}
                className="!h-11 !rounded-full !border-slate-200 !px-5"
              >
                PDF lich dang mo
              </Button>
            ) : null}
            {reviewSchedule?.status === "submitted" ? (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={approveMutation.isPending}
                onClick={() => handleApproveSchedule(reviewSchedule.schedule_id)}
                className="!h-11 !rounded-full !border-0 !bg-slate-950 !px-5 !shadow-none hover:!bg-slate-800"
              >
                Cong bo lich
              </Button>
            ) : null}
            {canMutateSelectedSchedule ? (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleDeleteSchedule}
                loading={deletingSchedule}
                className="!h-11 !rounded-full !px-5"
              >
                Xoa lich
              </Button>
            ) : null}
          </>
        }
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <SchedulePanel
            title="Lich dang cho duyet"
            className="h-full"
          >
            <div className="space-y-3">
              {submittedSchedules.length ? (
                submittedSchedules.map((item) => (
                  <ReviewQueueCard
                    key={item.schedule_id}
                    item={item}
                    tone="warm"
                    actions={(
                      <>
                        <Button size="small" onClick={() => setReviewScheduleId(item.schedule_id)} className="!rounded-full">
                          Mo
                        </Button>
                        <Button
                          size="small"
                          type="primary"
                          onClick={() => handleApproveSchedule(item.schedule_id)}
                          className="!rounded-full !border-0 !bg-slate-950 !shadow-none hover:!bg-slate-800"
                        >
                          Cong bo
                        </Button>
                      </>
                    )}
                  />
                ))
              ) : (
                <ScheduleEmptyState
                  title="Khong co lich dang cho duyet"
                  description="Khi clerk cac phong gui lich nhap, danh sach se hien o day."
                />
              )}
            </div>
          </SchedulePanel>

          <SchedulePanel
            title="Lich da cong bo"
            className="h-full"
          >
            <div className="space-y-3">
              {approvedSchedules.length ? (
                approvedSchedules.map((item) => (
                  <ReviewQueueCard
                    key={item.schedule_id}
                    item={item}
                    tone="success"
                    actions={(
                      <Button size="small" onClick={() => setReviewScheduleId(item.schedule_id)} className="!rounded-full">
                        Mo
                      </Button>
                    )}
                  />
                ))
              ) : (
                <ScheduleEmptyState
                  title="Chua co lich da cong bo"
                  description="Sau khi KHTH cong bo, tung lich phong ban se duoc liet ke tai day."
                />
              )}
            </div>
          </SchedulePanel>
        </div>

        {mergedApprovedSchedule ? (
          <SchedulePanel
            title="Lich truc tong hop toan vien"
          >
            <MasterMergedScheduleTable schedule={mergedApprovedSchedule} days={days} />
          </SchedulePanel>
        ) : null}

        <SchedulePanel
          title="Lich phong ban dang mo"
          actions={
            reviewSchedule ? (
              <div className="flex flex-wrap items-center gap-2">
                <ScheduleInlineBadge tone={STATUS_TONE[reviewSchedule.status] ?? "neutral"}>
                  {STATUS_LABEL[reviewSchedule.status] ?? reviewSchedule.status}
                </ScheduleInlineBadge>
                <ScheduleInlineBadge tone="neutral">
                  {reviewSchedule.source_department_name ?? `Phong ${reviewSchedule.source_department_id}`}
                </ScheduleInlineBadge>
              </div>
            ) : null
          }
        >
          {loading ? (
            <div className="flex justify-center py-20">
              <Spin size="large" />
            </div>
          ) : !reviewSchedule ? (
            <ScheduleEmptyState
              title={`Khong co lich truc phong ban cho tuan ${currentWeek}/${currentYear}`}
              description="Hay cho clerk gui lich nhap, hoac mo mot lich da cong bo de xem lai."
            />
          ) : (
            <ScheduleTable
              schedule={reviewSchedule}
              editable={canMutateSelectedSchedule}
              onAssigned={fetchSchedules}
              onAddShift={openAddShift}
              onEditShift={openEditShift}
              onDeleteShift={handleDeleteShift}
            />
          )}
        </SchedulePanel>
      </SchedulePageShell>

      <Modal
        title={editingShift ? "Chinh sua ca truc" : "Them ca truc"}
        open={shiftModalOpen}
        onCancel={closeShiftModal}
        onOk={handleSaveShift}
        okText={editingShift ? "Cap nhat" : "Them moi"}
        cancelText="Huy"
        confirmLoading={savingShift}
        destroyOnClose
      >
        <Form form={shiftForm} layout="vertical">
          <Form.Item label="Ngay truc">
            <span className="text-sm text-slate-700">{activeDate ? dayjs(activeDate).format("DD/MM/YYYY") : "--"}</span>
          </Form.Item>
          <Form.Item
            label="Loai ca"
            name="shift_type"
            rules={[{ required: true, message: "Vui long chon loai ca" }]}
          >
            <Select>
              <Option value="morning">Ca sang</Option>
              <Option value="afternoon">Ca chieu</Option>
              <Option value="night">Ca dem</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Bat dau"
            name="start_time"
            rules={[{ required: true, message: "Vui long chon gio bat dau" }]}
          >
            <TimePicker format="HH:mm" className="w-full" />
          </Form.Item>
          <Form.Item
            label="Ket thuc"
            name="end_time"
            rules={[{ required: true, message: "Vui long chon gio ket thuc" }]}
          >
            <TimePicker format="HH:mm" className="w-full" />
          </Form.Item>
          <Form.Item
            label="So nhan su toi da"
            name="max_staff"
            rules={[{ required: true, message: "Vui long nhap so luong toi da" }]}
          >
            <InputNumber min={1} max={100} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
