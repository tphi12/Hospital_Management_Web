/**
 * ScheduleTable
 *
 * Renders the duty schedule as a fixed-shape HTML table:
 *   rows    → 3 shift types  (morning / afternoon / night)
 *   columns → 7 days         (Mon – Sun of the schedule's week)
 *
 * Props
 * ─────
 *   schedule   {Schedule|null}  – Schedule object including `schedule.shifts[]`
 *   editable   {boolean}        – When true, cells show an "Assign staff" button
 *                                 and clicking an occupied cell opens the assign modal
 *   onAssigned {() => void}     – Optional callback invoked after a successful
 *                                 assignment so the parent can re-fetch / invalidate
 *   staffList  {User[]}         – Optional pre-loaded staff list.
 *                                 If omitted the component fetches by schedule's
 *                                 source_department_id (requires useAuth).
 *
 * Dependencies
 * ────────────
 *   antd v6, dayjs (isoWeek plugin), scheduleApi.assignUserToShift,
 *   userService (for internal staff fetch), useAuth
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Badge,
  Button,
  Divider,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Table,
  Tag,
  Tooltip,
  Typography,
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
import { useAuth } from "../../../hooks/useAuth";
import { assignUserToShift } from "../api/scheduleApi";
import { userService } from "../../../services";

dayjs.extend(isoWeek);

// ─── Static lookup tables ─────────────────────────────────────────────────────

const SHIFT_TYPES = ["morning", "afternoon", "night"];

const SHIFT_LABELS = {
  morning:   "Ca Sáng",
  afternoon: "Ca Chiều",
  night:     "Ca Đêm",
};

const SHIFT_COLORS = {
  morning:   "blue",
  afternoon: "orange",
  night:     "purple",
};

const SHIFT_BG = {
  morning:   "#e6f4ff",
  afternoon: "#fff7e6",
  night:     "#f9f0ff",
};

const DAY_NAMES = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Mon–Sun day objects for a given ISO week / year. */
function weekDays(week, year) {
  const monday = dayjs().year(year).isoWeek(week).isoWeekday(1);
  return Array.from({ length: 7 }, (_, i) => monday.add(i, "day"));
}

/** Normalise shift_date to "YYYY-MM-DD" whether it comes as a string or Date. */
function normDate(d) {
  return typeof d === "string" ? d.slice(0, 10) : dayjs(d).format("YYYY-MM-DD");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Content rendered inside a single table cell.
 * Shows all shifts of a given type on that day, plus an "assign" button.
 */
function CellContent({ shifts, editable, onAssign }) {
  if (!shifts || shifts.length === 0) {
    return (
      <span style={{ color: "#bbb", fontSize: 11 }}>—</span>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {shifts.map((shift) => {
        const assigned = shift.assignments?.length ?? 0;
        const full     = assigned >= shift.max_staff;

        return (
          <div
            key={shift.shift_id}
            style={{
              border:       "1px solid #e8e8e8",
              borderRadius:  6,
              padding:       "4px 6px",
              background:    "#fafafa",
              cursor:        editable && !full ? "pointer" : "default",
            }}
            onClick={editable && !full ? () => onAssign(shift) : undefined}
          >
            {/* Time */}
            <div style={{ fontSize: 11, color: "#555" }}>
              <ClockCircleOutlined style={{ marginRight: 3 }} />
              {String(shift.start_time).slice(0, 5)} –{" "}
              {String(shift.end_time).slice(0, 5)}
            </div>

            {/* Capacity badge */}
            <div style={{ fontSize: 11, marginTop: 2 }}>
              <TeamOutlined style={{ marginRight: 3, color: "#888" }} />
              <Badge
                count={`${assigned}/${shift.max_staff}`}
                style={{
                  backgroundColor: full ? "#f5222d" : "#52c41a",
                  fontSize: 10,
                  lineHeight: "16px",
                  height: 16,
                }}
              />
            </div>

            {/* Assigned staff names */}
            {shift.assignments && shift.assignments.length > 0 && (
              <>
                <Divider dashed style={{ margin: "3px 0" }} />
                <div className="flex flex-col gap-0.5">
                  {shift.assignments.map((a) => (
                    <Typography.Text
                      key={a.assignment_id}
                      style={{ fontSize: 10 }}
                      ellipsis
                    >
                      {a.full_name ?? `#${a.user_id}`}
                    </Typography.Text>
                  ))}
                </div>
              </>
            )}

            {/* "Assign" quick-action visible only when editable and not full */}
            {editable && !full && (
              <Tooltip title="Nhấn để phân công nhân viên">
                <div
                  style={{
                    marginTop:  3,
                    fontSize:   10,
                    color:      "#1677ff",
                    display:    "flex",
                    alignItems: "center",
                    gap:        2,
                  }}
                >
                  <UserAddOutlined />
                  Phân công
                </div>
              </Tooltip>
            )}
          </div>
        );
      })}
    </div>
  );
}

CellContent.propTypes = {
  shifts:   PropTypes.array,
  editable: PropTypes.bool,
  onAssign: PropTypes.func,
};

// ─── ScheduleTable ────────────────────────────────────────────────────────────

export default function ScheduleTable({
  schedule,
  editable = false,
  onAssigned,
  onAddShift,
  staffList: staffListProp,
}) {
  const { user } = useAuth();

  // ── Staff list ───────────────────────────────────────────────────────────
  const [staffList, setStaffList] = useState(staffListProp ?? []);

  const fetchStaff = useCallback(async () => {
    if (staffListProp) return;                    // parent supplied the list
    const deptId =
      schedule?.source_department_id ?? user?.departmentId;
    if (!deptId) return;
    try {
      const res  = await userService.getAllUsers({ department_id: deptId });
      const list = res.data ?? res ?? [];
      setStaffList(Array.isArray(list) ? list : []);
    } catch {
      /* non-critical */
    }
  }, [staffListProp, schedule?.source_department_id, user?.departmentId]);

  useEffect(() => {
    if (editable) fetchStaff();
  }, [editable, fetchStaff]);

  // Sync if parent passes a fresh list after mount
  useEffect(() => {
    if (staffListProp) setStaffList(staffListProp);
  }, [staffListProp]);

  // ── Assign modal state ───────────────────────────────────────────────────
  const [modalOpen,   setModalOpen]   = useState(false);
  const [activeShift, setActiveShift] = useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [assignForm]  = Form.useForm();

  const openAssign = useCallback((shift) => {
    setActiveShift(shift);
    assignForm.resetFields();
    setModalOpen(true);
  }, [assignForm]);

  const closeAssign = useCallback(() => {
    setModalOpen(false);
    assignForm.resetFields();
    setActiveShift(null);
  }, [assignForm]);

  const handleAssign = async () => {
    let values;
    try { values = await assignForm.validateFields(); }
    catch { return; }                              // inline validation feedback

    setSubmitting(true);
    try {
      const res = await assignUserToShift({
        shift_id: activeShift.shift_id,
        user_id:  values.user_id,
        note:     values.note,
      });
      if (res.success) {
        const { message: antdMessage } = await import("antd");
        antdMessage.success("Phân công nhân viên thành công");
        closeAssign();
        onAssigned?.();
      } else {
        const { message: antdMessage } = await import("antd");
        antdMessage.error(res.message ?? "Phân công thất bại");
      }
    } catch {
      const { message: antdMessage } = await import("antd");
      antdMessage.error("Lỗi kết nối máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Build table data ─────────────────────────────────────────────────────

  /** 7 dayjs objects for the schedule's week */
  const days = useMemo(() => {
    if (!schedule) return [];
    return weekDays(schedule.week, schedule.year);
  }, [schedule]);

  /** Lookup: (dateStr, shiftType) → Shift[] */
  const shiftIndex = useMemo(() => {
    const idx = {};
    for (const shift of schedule?.shifts ?? []) {
      const key = `${normDate(shift.shift_date)}::${shift.shift_type}`;
      if (!idx[key]) idx[key] = [];
      idx[key].push(shift);
    }
    return idx;
  }, [schedule]);

  // ── Table columns ────────────────────────────────────────────────────────

  const columns = useMemo(() => {
    const shiftTypeCol = {
      title:     "Ca / Ngày",
      dataIndex: "shiftType",
      width:     106,
      fixed:     "left",
      render:    (type) => (
        <Tag
          color={SHIFT_COLORS[type]}
          style={{
            fontWeight:  600,
            fontSize:    12,
            padding:     "2px 8px",
            margin:       0,
          }}
        >
          {SHIFT_LABELS[type]}
        </Tag>
      ),
      onCell: (row) => ({
        style: {
          background:  SHIFT_BG[row.shiftType],
          textAlign:   "center",
          verticalAlign: "middle",
        },
      }),
    };

    const dayCols = days.map((day, idx) => {
      const dateStr = day.format("YYYY-MM-DD");
      const isToday = day.isSame(dayjs(), "day");

      return {
        key:   dateStr,
        width: 150,
        title: (
          <div style={{ textAlign: "center", lineHeight: 1.4 }}>
            <div
              style={{
                fontWeight: 600,
                fontSize:   12,
                color:      isToday ? "#1677ff" : undefined,
              }}
            >
              {DAY_NAMES[idx]}
            </div>
            <div
              style={{
                fontSize:  11,
                color:     isToday ? "#ff4d4f" : "#888",
                fontWeight: isToday ? 600 : 400,
              }}
            >
              {day.format("DD/MM")}
            </div>
            {editable && onAddShift && (
              <Tooltip title="Thêm ca trực">
                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={(e) => { e.stopPropagation(); onAddShift(dateStr); }}
                  style={{
                    color:     "#1677ff",
                    fontSize:  11,
                    height:    20,
                    padding:   "0 4px",
                    marginTop: 2,
                  }}
                />
              </Tooltip>
            )}
          </div>
        ),
        onHeaderCell: () => ({
          style: {
            background: isToday ? "#e6f4ff" : undefined,
            borderBottom: isToday ? "2px solid #1677ff" : undefined,
          },
        }),
        onCell: (row) => ({
          style: {
            background: isToday
              ? `${SHIFT_BG[row.shiftType]}cc`   // slight tint for today column
              : SHIFT_BG[row.shiftType],
            verticalAlign: "top",
            padding: "6px 8px",
          },
        }),
        render: (_, row) => {
          const shifts = shiftIndex[`${dateStr}::${row.shiftType}`] ?? [];
          return (
            <CellContent
              shifts={shifts}
              editable={editable}
              onAssign={openAssign}
            />
          );
        },
      };
    });

    return [shiftTypeCol, ...dayCols];
  }, [days, shiftIndex, editable, openAssign, onAddShift]);

  // ── Table rows (one per shift type) ─────────────────────────────────────

  const dataSource = useMemo(
    () => SHIFT_TYPES.map((type) => ({ key: type, shiftType: type })),
    [],
  );

  // ── Empty guard ──────────────────────────────────────────────────────────

  if (!schedule) {
    return (
      <Empty
        description="Chưa có lịch trực"
        style={{ padding: "32px 0" }}
      />
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <Table
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        scroll={{ x: "max-content" }}
        bordered
        size="small"
        rowKey="key"
        style={{ userSelect: "none" }}
      />

      {/* ── Assign staff modal ───────────────────────────────────── */}
      <Modal
        title={
          activeShift
            ? `Phân công nhân viên — ${SHIFT_LABELS[activeShift.shift_type] ?? activeShift.shift_type} · ${
                activeShift.shift_date
                  ? dayjs(normDate(activeShift.shift_date)).format("DD/MM/YYYY")
                  : ""
              }`
            : "Phân công nhân viên"
        }
        open={modalOpen}
        onCancel={closeAssign}
        onOk={handleAssign}
        okText="Phân công"
        cancelText="Huỷ"
        confirmLoading={submitting}
        destroyOnClose
      >
        {/* Shift summary banner */}
        {activeShift && (
          <div
            style={{
              marginBottom: 12,
              padding:      "8px 12px",
              borderRadius:  6,
              background:   SHIFT_BG[activeShift.shift_type],
              border:       "1px solid #e8e8e8",
            }}
          >
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              {String(activeShift.start_time).slice(0, 5)} –{" "}
              {String(activeShift.end_time).slice(0, 5)}
              {"   ·   "}
              <TeamOutlined style={{ marginRight: 4 }} />
              Đã phân công:{" "}
              <strong>
                {activeShift.assignments?.length ?? 0} /{" "}
                {activeShift.max_staff}
              </strong>{" "}
              người
            </Typography.Text>

            {/* Already-assigned staff list */}
            {activeShift.assignments && activeShift.assignments.length > 0 && (
              <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                {activeShift.assignments.map((a) => (
                  <Tag key={a.assignment_id} style={{ fontSize: 11 }}>
                    {a.full_name ?? `#${a.user_id}`}
                  </Tag>
                ))}
              </div>
            )}
          </div>
        )}

        <Form form={assignForm} layout="vertical">
          <Form.Item
            name="user_id"
            label="Chọn nhân viên"
            rules={[{ required: true, message: "Vui lòng chọn nhân viên" }]}
          >
            <Select
              showSearch
              placeholder="Tìm theo tên hoặc mã nhân viên..."
              optionFilterProp="label"
              options={staffList.map((s) => {
                const id           = s.user_id ?? s.id;
                const alreadyIn    = activeShift?.assignments?.some(
                  (a) => a.user_id === id,
                );
                const label        =
                  (s.full_name ?? s.username ?? `User #${id}`) +
                  (s.employee_code ? ` (${s.employee_code})` : "") +
                  (alreadyIn ? " — đã phân công" : "");
                return { value: id, label, disabled: alreadyIn };
              })}
              filterOption={(input, opt) =>
                opt?.label?.toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú (tuỳ chọn)">
            <Input.TextArea rows={2} placeholder="Ghi chú khi phân công..." />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

ScheduleTable.propTypes = {
  /** Fully-loaded Schedule object, including shifts[].assignments[] */
  schedule:    PropTypes.object,
  /** If true, cells are clickable and show the Assign modal + add-shift button */
  editable:    PropTypes.bool,
  /** Called after a successful staff assignment so the parent can refetch */
  onAssigned:  PropTypes.func,
  /**
   * Called with a date string 'YYYY-MM-DD' when the user clicks the
   * '+ Thêm ca trực' button on a day column header.
   * The parent is responsible for opening the add-shift form / modal.
   */
  onAddShift:  PropTypes.func,
  /** Optional pre-loaded staff array; fetched internally when absent */
  staffList:   PropTypes.array,
};
