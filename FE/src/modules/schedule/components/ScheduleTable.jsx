import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Form,
  Input,
  Modal,
  Select,
  Tag,
  Typography,
  message as antdMessage,
} from "antd";
import {
  ClockCircleOutlined,
  PlusOutlined,
  TeamOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { weekDays } from "../utils/calendar";
import { useAuth } from "../../../hooks/useAuth";
import { assignUserToShift } from "../api/scheduleApi";
import { userService } from "../../../services";

dayjs.extend(isoWeek);

const SHIFT_TYPES = ["morning", "afternoon", "night"];

const SHIFT_LABELS = {
  morning: "Ca Sang",
  afternoon: "Ca Chieu",
  night: "Ca Dem",
};

const SHIFT_STYLES = {
  morning: {
    chip: "border-blue-200 bg-blue-50 text-blue-700",
    panel: "border-blue-100 bg-blue-50/60",
  },
  afternoon: {
    chip: "border-amber-200 bg-amber-50 text-amber-700",
    panel: "border-amber-100 bg-amber-50/60",
  },
  night: {
    chip: "border-violet-200 bg-violet-50 text-violet-700",
    panel: "border-violet-100 bg-violet-50/60",
  },
};

const DAY_NAMES = ["Thu Hai", "Thu Ba", "Thu Tu", "Thu Nam", "Thu Sau", "Thu Bay", "Chu Nhat"];

function normDate(value) {
  return typeof value === "string" ? value.slice(0, 10) : dayjs(value).format("YYYY-MM-DD");
}

function ShiftCell({ shifts, editable, onAssign, onEditShift, onDeleteShift }) {
  if (!shifts.length) {
    return <p className="text-xs text-slate-300">Khong co ca truc</p>;
  }

  return (
    <div className="space-y-2">
      {shifts.map((shift) => {
        const assigned = shift.assignments?.length ?? 0;
        const isFull = assigned >= shift.max_staff;
        const style = SHIFT_STYLES[shift.shift_type] ?? SHIFT_STYLES.morning;

        return (
          <div
            key={shift.shift_id}
            className={`rounded-2xl border px-3 py-3 shadow-sm transition ${style.panel} ${
              editable && !isFull ? "cursor-pointer hover:border-slate-300" : ""
            }`}
            onClick={editable && !isFull ? () => onAssign(shift) : undefined}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${style.chip}`}>
                  {SHIFT_LABELS[shift.shift_type] ?? shift.shift_type}
                </span>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <ClockCircleOutlined />
                  <span>{String(shift.start_time).slice(0, 5)} - {String(shift.end_time).slice(0, 5)}</span>
                </div>
              </div>

              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                {assigned}/{shift.max_staff}
              </span>
            </div>

            {shift.assignments?.length ? (
              <div className="mt-3 space-y-1.5 border-t border-white/70 pt-3">
                {shift.assignments.map((assignment) => (
                  <div
                    key={assignment.assignment_id}
                    className="truncate text-xs text-slate-600"
                    title={assignment.full_name ?? `#${assignment.user_id}`}
                  >
                    {assignment.full_name ?? `#${assignment.user_id}`}
                  </div>
                ))}
              </div>
            ) : null}

            {editable ? (
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/70 pt-3">
                {!isFull ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 transition hover:text-slate-950"
                    data-testid={`assign-shift-${shift.shift_id}`}
                  >
                    <UserAddOutlined />
                    Phan cong
                  </button>
                ) : (
                  <span className="text-xs text-slate-400">Da du nguoi</span>
                )}

                <div className="flex items-center gap-2">
                  {onEditShift ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEditShift(shift);
                      }}
                      className="text-xs font-medium text-slate-500 transition hover:text-slate-900"
                      data-testid={`edit-shift-${shift.shift_id}`}
                    >
                      Sua
                    </button>
                  ) : null}
                  {onDeleteShift ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteShift(shift);
                      }}
                      className="text-xs font-medium text-red-600 transition hover:text-red-700"
                      data-testid={`delete-shift-${shift.shift_id}`}
                    >
                      Xoa
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

ShiftCell.propTypes = {
  shifts: PropTypes.array.isRequired,
  editable: PropTypes.bool,
  onAssign: PropTypes.func,
  onEditShift: PropTypes.func,
  onDeleteShift: PropTypes.func,
};

export default function ScheduleTable({
  schedule,
  editable = false,
  onAssigned,
  onAddShift,
  onEditShift,
  onDeleteShift,
  staffList: staffListProp,
}) {
  const { user } = useAuth();
  const [staffList, setStaffList] = useState(staffListProp ?? []);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeShift, setActiveShift] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [assignForm] = Form.useForm();

  const fetchStaff = useCallback(async () => {
    if (staffListProp) return;
    const deptId = schedule?.source_department_id ?? user?.departmentId;
    if (!deptId) return;

    try {
      const response = await userService.getAllUsers({ department_id: deptId });
      const list = response.data ?? response ?? [];
      setStaffList(Array.isArray(list) ? list : []);
    } catch {
      setStaffList([]);
    }
  }, [schedule?.source_department_id, staffListProp, user?.departmentId]);

  useEffect(() => {
    if (editable) fetchStaff();
  }, [editable, fetchStaff]);

  useEffect(() => {
    if (staffListProp) setStaffList(staffListProp);
  }, [staffListProp]);

  const days = useMemo(() => {
    if (!schedule) return [];
    return weekDays(schedule.week, schedule.year);
  }, [schedule]);

  const shiftIndex = useMemo(() => {
    const index = {};
    for (const shift of schedule?.shifts ?? []) {
      const key = `${normDate(shift.shift_date)}::${shift.shift_type}`;
      if (!index[key]) index[key] = [];
      index[key].push(shift);
    }
    return index;
  }, [schedule]);

  const openAssign = useCallback((shift) => {
    setActiveShift(shift);
    assignForm.resetFields();
    setModalOpen(true);
  }, [assignForm]);

  const closeAssign = useCallback(() => {
    setModalOpen(false);
    setActiveShift(null);
    assignForm.resetFields();
  }, [assignForm]);

  const handleAssign = async () => {
    let values;
    try {
      values = await assignForm.validateFields();
    } catch {
      return;
    }

    setSubmitting(true);
    try {
      const response = await assignUserToShift({
        shift_id: activeShift.shift_id,
        user_id: values.user_id,
        note: values.note,
      });

      if (!response.success) {
        antdMessage.error(response.message ?? "Phan cong that bai");
        return;
      }

      antdMessage.success("Phan cong nhan vien thanh cong");
      closeAssign();
      onAssigned?.();
    } catch {
      antdMessage.error("Loi ket noi may chu");
    } finally {
      setSubmitting(false);
    }
  };

  if (!schedule) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
        <p className="text-sm font-semibold text-slate-800">Chua co lich truc</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-[1040px] w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 w-[150px] rounded-l-3xl border border-slate-200 bg-[#f7f6f3] px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Shift
              </th>
              {days.map((day, index) => {
                const dateStr = day.format("YYYY-MM-DD");
                const isToday = day.isSame(dayjs(), "day");

                return (
                  <th
                    key={dateStr}
                    className={`border-y border-r border-slate-200 bg-[#f7f6f3] px-4 py-4 text-left align-top ${
                      index === days.length - 1 ? "rounded-r-3xl" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-sm font-semibold ${isToday ? "text-slate-950" : "text-slate-700"}`}>
                          {DAY_NAMES[index]}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{day.format("DD/MM/YYYY")}</p>
                      </div>

                      {editable && onAddShift ? (
                        <button
                          type="button"
                          onClick={() => onAddShift(dateStr)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
                          data-testid={`add-shift-${dateStr}`}
                        >
                          <PlusOutlined />
                        </button>
                      ) : null}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {SHIFT_TYPES.map((shiftType) => (
              <tr key={shiftType}>
                <td className="sticky left-0 z-10 border-x border-b border-slate-200 bg-white px-4 py-5 align-top">
                  <div className="space-y-2">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                      (SHIFT_STYLES[shiftType] ?? SHIFT_STYLES.morning).chip
                    }`}>
                      {SHIFT_LABELS[shiftType] ?? shiftType}
                    </span>
                    <p className="text-xs text-slate-500">View, assign, and adjust staffing for this shift block.</p>
                  </div>
                </td>

                {days.map((day) => {
                  const dateStr = day.format("YYYY-MM-DD");
                  const shifts = shiftIndex[`${dateStr}::${shiftType}`] ?? [];

                  return (
                    <td key={`${dateStr}-${shiftType}`} className="border-r border-b border-slate-200 bg-white px-3 py-3 align-top">
                      <ShiftCell
                        shifts={shifts}
                        editable={editable}
                        onAssign={openAssign}
                        onEditShift={onEditShift}
                        onDeleteShift={onDeleteShift}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        title={
          activeShift
            ? `Phan cong nhan vien - ${SHIFT_LABELS[activeShift.shift_type] ?? activeShift.shift_type}`
            : "Phan cong nhan vien"
        }
        open={modalOpen}
        onCancel={closeAssign}
        onOk={handleAssign}
        okText="Phan cong"
        cancelText="Huy"
        confirmLoading={submitting}
        destroyOnClose
      >
        {activeShift ? (
          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2">
                <ClockCircleOutlined />
                {String(activeShift.start_time).slice(0, 5)} - {String(activeShift.end_time).slice(0, 5)}
              </span>
              <span className="inline-flex items-center gap-2">
                <TeamOutlined />
                {activeShift.assignments?.length ?? 0}/{activeShift.max_staff} nguoi
              </span>
            </div>

            {activeShift.assignments?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {activeShift.assignments.map((assignment) => (
                  <Tag key={assignment.assignment_id}>
                    {assignment.full_name ?? `#${assignment.user_id}`}
                  </Tag>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <Form form={assignForm} layout="vertical">
          <Form.Item
            name="user_id"
            label="Chon nhan vien"
            rules={[{ required: true, message: "Vui long chon nhan vien" }]}
          >
            <Select
              showSearch
              placeholder="Tim theo ten hoac ma nhan vien"
              optionFilterProp="label"
              options={staffList.map((staff) => {
                const id = staff.user_id ?? staff.id;
                const alreadyAssigned = activeShift?.assignments?.some((assignment) => assignment.user_id === id);
                const label =
                  (staff.full_name ?? staff.username ?? `User #${id}`) +
                  (staff.employee_code ? ` (${staff.employee_code})` : "") +
                  (alreadyAssigned ? " - da phan cong" : "");

                return {
                  value: id,
                  label,
                  disabled: alreadyAssigned,
                };
              })}
            />
          </Form.Item>

          <Form.Item name="note" label="Ghi chu">
            <Input.TextArea rows={2} placeholder="Ghi chu khi phan cong" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

ScheduleTable.propTypes = {
  schedule: PropTypes.object,
  editable: PropTypes.bool,
  onAssigned: PropTypes.func,
  onAddShift: PropTypes.func,
  onEditShift: PropTypes.func,
  onDeleteShift: PropTypes.func,
  staffList: PropTypes.array,
};
