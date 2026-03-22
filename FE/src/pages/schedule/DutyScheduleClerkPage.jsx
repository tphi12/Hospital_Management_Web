import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Spin,
  TimePicker,
  message,
} from "antd";
import {
  CalendarOutlined,
  DeleteOutlined,
  LeftOutlined,
  PlusOutlined,
  RightOutlined,
  SendOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

import { isoWeeksInYear, weekDays } from "../../modules/schedule/utils/calendar";
import { useAuth } from "../../hooks/useAuth";
import { userService } from "../../services";
import {
  deleteSchedule,
  deleteShift,
  getSchedulesByWeek,
  updateShift,
} from "../../modules/schedule/api/scheduleApi";
import {
  useAddShiftMutation,
  useCreateScheduleMutation,
  useSubmitScheduleMutation,
} from "../../modules/schedule/hooks/useScheduleQuery";
import ScheduleTable from "../../modules/schedule/components/ScheduleTable";
import {
  ScheduleEmptyState,
  ScheduleInlineBadge,
  SchedulePageShell,
  SchedulePanel,
} from "../../modules/schedule/components/ScheduleWorkspace";

dayjs.extend(isoWeek);

const { Option } = Select;

const STATUS_LABELS = {
  draft: "Draft",
  submitted: "Đã gửi KHTH",
  approved: "Đã duyệt",
};

const SHIFT_TYPE_LABELS = {
  morning: "Ca sang",
  afternoon: "Ca chieu",
  night: "Ca dem",
};

export default function DutyScheduleClerkPage() {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(() => dayjs().isoWeek());
  const [currentYear, setCurrentYear] = useState(() => dayjs().year());
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [addShiftModalOpen, setAddShiftModalOpen] = useState(false);
  const [activeDate, setActiveDate] = useState(null);
  const [editingShift, setEditingShift] = useState(null);
  const [savingShift, setSavingShift] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState(false);
  const [createForm] = Form.useForm();
  const [shiftForm] = Form.useForm();

  const createMutation = useCreateScheduleMutation();
  const submitMutation = useSubmitScheduleMutation();
  const addShiftMutation = useAddShiftMutation();
  const anyMutating =
    createMutation.isPending ||
    submitMutation.isPending ||
    addShiftMutation.isPending;

  const days = weekDays(currentWeek, currentYear);
  const weekRangeLabel = `${days[0].format("DD/MM/YYYY")} - ${days[6].format("DD/MM/YYYY")}`;
  const isSourceDept = schedule && user?.departmentId === schedule.source_department_id;
  const canSubmit = schedule?.status === "draft" && isSourceDept;
  const canEdit = schedule?.status === "draft" && isSourceDept;
  const canDeleteSchedule = schedule?.status === "draft" && isSourceDept;
  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSchedulesByWeek(currentWeek, currentYear, "duty");
      if (res.success) {
        const found =
          (res.data ?? []).find((item) => item.source_department_id === user?.departmentId) ?? null;
        setSchedule(found);
      } else {
        message.error(res.message ?? "Cannot load duty schedule");
        setSchedule(null);
      }
    } catch {
      message.error("Server connection error");
      setSchedule(null);
    } finally {
      setLoading(false);
    }
  }, [currentWeek, currentYear, user?.departmentId]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const fetchStaff = useCallback(async () => {
    if (!user?.departmentId) return;
    try {
      const res = await userService.getAllUsers({ department_id: user.departmentId });
      const list = res.data ?? res ?? [];
      setStaffList(Array.isArray(list) ? list : []);
    } catch {
      setStaffList([]);
    }
  }, [user?.departmentId]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const goToPrevWeek = () => {
    if (currentWeek === 1) {
      setCurrentWeek(52);
      setCurrentYear((value) => value - 1);
    } else {
      setCurrentWeek((value) => value - 1);
    }
  };

  const goToNextWeek = () => {
    const weeksInYear = isoWeeksInYear(currentYear);
    if (currentWeek >= weeksInYear) {
      setCurrentWeek(1);
      setCurrentYear((value) => value + 1);
    } else {
      setCurrentWeek((value) => value + 1);
    }
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(dayjs().isoWeek());
    setCurrentYear(dayjs().year());
  };

  const handleCreateSchedule = async () => {
    let values;
    try {
      values = await createForm.validateFields();
    } catch {
      return;
    }

    try {
      await createMutation.mutateAsync({
        week: currentWeek,
        year: currentYear,
        description: values.description,
      });
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchSchedule();
    } catch {
      // mutation hook handles toast
    }
  };

  const closeShiftModal = () => {
    setAddShiftModalOpen(false);
    setActiveDate(null);
    setEditingShift(null);
    shiftForm.resetFields();
  };

  const handleSaveShift = async () => {
    let values;
    try {
      values = await shiftForm.validateFields();
    } catch {
      return;
    }

    try {
      setSavingShift(true);

      if (editingShift?.shift_id) {
        const response = await updateShift(editingShift.shift_id, {
          shift_date: activeDate,
          shift_type: values.shift_type,
          start_time: values.start_time.format("HH:mm"),
          end_time: values.end_time.format("HH:mm"),
          max_staff: values.max_staff,
          note: values.notes,
        });

        if (!response.success) {
          message.error(response.message || "Cap nhat ca truc that bai");
          return;
        }
      } else {
        await addShiftMutation.mutateAsync({
          schedule_id: schedule.schedule_id,
          department_id: user.departmentId,
          shift_date: activeDate,
          shift_type: values.shift_type,
          start_time: values.start_time.format("HH:mm"),
          end_time: values.end_time.format("HH:mm"),
          max_staff: values.max_staff,
          notes: values.notes,
          staff_ids: values.staff_ids,
        });
      }

      closeShiftModal();
      fetchSchedule();
    } catch {
      // mutation hook handles toast
    } finally {
      setSavingShift(false);
    }
  };

  const handleSubmitSchedule = () => {
    Modal.confirm({
      title: "Submit duty schedule",
      content: "The schedule will be sent to KHTH for review and approval.",
      okText: "Submit",
      cancelText: "Cancel",
      onOk: async () => {
        await submitMutation.mutateAsync(schedule.schedule_id);
        fetchSchedule();
      },
    });
  };

  const openAddShift = (dateStr) => {
    setActiveDate(dateStr);
    setEditingShift(null);
    shiftForm.resetFields();
    setAddShiftModalOpen(true);
  };

  const openEditShift = (shift) => {
    setEditingShift(shift);
    setActiveDate(dayjs(shift.shift_date).format("YYYY-MM-DD"));
    shiftForm.setFieldsValue({
      shift_type: shift.shift_type,
      start_time: dayjs(String(shift.start_time).slice(0, 5), "HH:mm"),
      end_time: dayjs(String(shift.end_time).slice(0, 5), "HH:mm"),
      max_staff: shift.max_staff,
      notes: shift.note,
      staff_ids: shift.assignments?.map((assignment) => assignment.user_id) ?? [],
    });
    setAddShiftModalOpen(true);
  };

  const handleDeleteShift = async (shift) => {
    if (!window.confirm("Ban co chac muon xoa ca truc nay?")) return;

    try {
      const response = await deleteShift(shift.shift_id);
      if (!response.success) {
        message.error(response.message || "Xoa ca truc that bai");
        return;
      }

      message.success("Xoa ca truc thanh cong");
      fetchSchedule();
    } catch {
      message.error("Xoa ca truc that bai");
    }
  };

  const handleDeleteSchedule = async () => {
    if (!schedule?.schedule_id) return;
    if (!window.confirm("Ban co chac muon xoa lich truc nhap nay?")) return;

    try {
      setDeletingSchedule(true);
      const response = await deleteSchedule(schedule.schedule_id);
      if (!response.success) {
        message.error(response.message || "Xoa lich that bai");
        return;
      }

      message.success("Xoa lich truc thanh cong");
      setSchedule(null);
      fetchSchedule();
    } catch {
      message.error("Xoa lich that bai");
    } finally {
      setDeletingSchedule(false);
    }
  };

  return (
    <div data-testid="duty-clerk-page">
      <Spin spinning={anyMutating} fullscreen tip="Dang xu ly..." />

      <SchedulePageShell
        minimal
        actions={
          <>
            <div className="flex h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-600">
              <CalendarOutlined className="mr-2" />
              {weekRangeLabel}
            </div>

            {schedule && (
              <div className="flex h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-700">
                <span className="mr-2">Status</span>
                <ScheduleInlineBadge
                  tone={
                    schedule.status === "approved"
                      ? "success"
                      : schedule.status === "submitted"
                        ? "cool"
                        : "neutral"
                  }
                >
                  {STATUS_LABELS[schedule.status]}
                </ScheduleInlineBadge>
              </div>
            )}

            {canSubmit && (
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSubmitSchedule}
                loading={submitMutation.isPending}
                disabled={anyMutating}
                data-testid="submit-duty-schedule-button"
                className="!h-11 !rounded-full !border-0 !bg-slate-950 !px-5 !shadow-none hover:!bg-slate-800"
              >
                Gui KHTH
              </Button>
            )}

            {canDeleteSchedule && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleDeleteSchedule}
                loading={deletingSchedule}
                className="!h-11 !rounded-full !px-5"
              >
                Xoa lich nhap
              </Button>
            )}

            {!schedule && !loading && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalOpen(true)}
                disabled={anyMutating}
                data-testid="create-duty-schedule-button"
                className="!h-11 !rounded-full !border-0 !bg-slate-950 !px-5 !shadow-none hover:!bg-slate-800"
              >
                Tao lich truc
              </Button>
            )}
          </>
        }
      >
        <SchedulePanel
          title="Week navigation"
          actions={
            <>
              <Button icon={<LeftOutlined />} onClick={goToPrevWeek} size="small" className="!rounded-full" />
              <Button onClick={goToCurrentWeek} size="small" className="!rounded-full">
                Tuan hien tai
              </Button>
              <Button icon={<RightOutlined />} onClick={goToNextWeek} size="small" className="!rounded-full" />
            </>
          }
        >
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <ScheduleInlineBadge tone="neutral">{`Week ${currentWeek}/${currentYear}`}</ScheduleInlineBadge>
            <span>{weekRangeLabel}</span>
          </div>
        </SchedulePanel>

        <SchedulePanel
          title="Department duty matrix"
        >
          {loading ? (
            <div className="flex justify-center py-16">
              <Spin size="large" />
            </div>
          ) : !schedule ? (
            <ScheduleEmptyState
              title={`No duty schedule for week ${currentWeek}/${currentYear}`}
              description="Create a new duty schedule to start arranging shifts for your department."
            />
          ) : (
            <ScheduleTable
              schedule={schedule}
              editable={canEdit}
              onAssigned={fetchSchedule}
              staffList={staffList}
              onAddShift={openAddShift}
              onEditShift={openEditShift}
              onDeleteShift={handleDeleteShift}
            />
          )}
        </SchedulePanel>
      </SchedulePageShell>

      <Modal
        title="Create duty schedule"
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          createForm.resetFields();
        }}
        onOk={handleCreateSchedule}
        okText="Create"
        cancelText="Cancel"
        confirmLoading={createMutation.isPending}
        okButtonProps={{ "data-testid": "confirm-create-duty-schedule-button" }}
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item label="Week">
            <div className="text-sm text-slate-700">
              <div className="font-medium">{`Week ${currentWeek}/${currentYear}`}</div>
              <div className="text-slate-500">{weekRangeLabel}</div>
            </div>
          </Form.Item>
          <Form.Item name="description" label="Notes">
            <Input.TextArea rows={2} placeholder="Optional note for this duty schedule" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${editingShift ? "Chinh sua" : "Add shift"}${activeDate ? ` - ${dayjs(activeDate).format("DD/MM/YYYY")}` : ""}`}
        open={addShiftModalOpen}
        onCancel={closeShiftModal}
        onOk={handleSaveShift}
        okText={editingShift ? "Cap nhat" : "Add shift"}
        cancelText="Cancel"
        confirmLoading={savingShift || addShiftMutation.isPending}
        okButtonProps={{ "data-testid": "confirm-add-shift-button" }}
      >
        <Form form={shiftForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="shift_type"
            label="Shift type"
            rules={[{ required: true, message: "Please choose a shift type" }]}
          >
            <Select placeholder="Select shift type">
              {Object.entries(SHIFT_TYPE_LABELS).map(([value, label]) => (
                <Option key={value} value={value}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Form.Item
              name="start_time"
              label="Start time"
              rules={[{ required: true, message: "Required" }]}
            >
              <TimePicker format="HH:mm" minuteStep={15} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="end_time"
              label="End time"
              rules={[{ required: true, message: "Required" }]}
            >
              <TimePicker format="HH:mm" minuteStep={15} style={{ width: "100%" }} />
            </Form.Item>
          </div>

          <Form.Item
            name="max_staff"
            label="Maximum staff"
            initialValue={3}
            rules={[{ required: true, message: "Required" }]}
          >
            <InputNumber min={1} max={50} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="staff_ids" label="Assign staff immediately">
            <Select
              mode="multiple"
              showSearch
              placeholder="Choose staff from your department"
              optionFilterProp="label"
              options={staffList.map((item) => {
                const id = item.user_id ?? item.id;
                const label =
                  (item.full_name ?? item.username ?? `User #${id}`) +
                  (item.employee_code ? ` (${item.employee_code})` : "");
                return { value: id, label };
              })}
            />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Optional shift notes" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
