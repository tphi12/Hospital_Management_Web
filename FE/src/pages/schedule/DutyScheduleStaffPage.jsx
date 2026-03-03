import { useState, useEffect, useCallback } from "react";
import {
  Badge, Button, Card, Col, Empty, message, Row, Select,
  Spin, Tag, Tooltip, Typography, Space, Divider,
} from "antd";
import {
  CalendarOutlined, ClockCircleOutlined, FilePdfOutlined,
  LeftOutlined, RightOutlined, TeamOutlined, CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { useAuth } from "../../hooks/useAuth";
import { exportMasterDutySchedulePdf, getSchedulesByWeek } from "../../modules/schedule/api/scheduleApi";
import { downloadSchedulePdf } from "../../modules/schedule/utils/downloadSchedulePdf";
import { useApproveScheduleMutation } from "../../modules/schedule/hooks/useScheduleQuery";
import { isKHTHStaff } from "../../lib/roleUtils";

dayjs.extend(isoWeek);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Return 7 dayjs objects Mon→Sun for an ISO week/year. */
function weekDays(week, year) {
  const monday = dayjs().year(year).isoWeek(week).isoWeekday(1);
  return Array.from({ length: 7 }, (_, i) => monday.add(i, "day"));
}

/** A year has 53 ISO weeks if Jan 1 or Dec 31 falls on a Thursday. */
function isoWeeksInYear(year) {
  const jan1  = dayjs(`${year}-01-01`).isoWeekday();
  const dec31 = dayjs(`${year}-12-31`).isoWeekday();
  return jan1 === 4 || dec31 === 4 ? 53 : 52;
}

function fmtTime(t) {
  return t ? String(t).slice(0, 5) : "--:--";
}

function normaliseDate(d) {
  return (typeof d === "string" ? d : dayjs(d).format("YYYY-MM-DD")).slice(0, 10);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = [
  "Thứ Hai", "Thứ Ba", "Thứ Tư",
  "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật",
];

const SHIFT_LABELS = {
  morning:   "Ca sáng",
  afternoon: "Ca chiều",
  night:     "Ca đêm",
};

const SHIFT_TYPE_ORDER = {
  morning: 1,
  afternoon: 2,
  night: 3,
};

const SHIFT_COLORS = {
  morning:   "#1677ff",
  afternoon: "#fa8c16",
  night:     "#722ed1",
};

const SHIFT_BG = {
  morning:   "#e6f4ff",
  afternoon: "#fff7e6",
  night:     "#f9f0ff",
};

const { Title, Text } = Typography;
const { Option } = Select;

// ─── DutyScheduleStaffPage ────────────────────────────────────────────────────

export default function DutyScheduleStaffPage() {
  const { user } = useAuth();
  const canReviewAsKHTH = isKHTHStaff(user);
  const approveMutation = useApproveScheduleMutation();

  // ── Week navigation ──────────────────────────────────────────────────────
  const [currentWeek, setCurrentWeek] = useState(() => dayjs().isoWeek());
  const [currentYear, setCurrentYear] = useState(() => dayjs().year());

  // ── Data ─────────────────────────────────────────────────────────────────
  const [schedules,   setSchedules]   = useState([]);
  const [reviewScheduleId, setReviewScheduleId] = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [exporting,   setExporting]   = useState(false);

  // ── Department filter: show all depts or just the user's dept ────────────
  const [deptFilter, setDeptFilter]   = useState("all");

  const days = weekDays(currentWeek, currentYear);

  // ─── Fetch ─────────────────────────────────────────────────────────────

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSchedulesByWeek(currentWeek, currentYear, "duty");
      if (res.success) {
        const list = res.data ?? [];
        const visible = canReviewAsKHTH
          ? list.filter((s) => s.status === "submitted" || s.status === "approved")
          : list.filter((s) => s.status === "approved");

        setSchedules(visible);

        if (canReviewAsKHTH) {
          const submittedSchedules = visible.filter((s) => s.status === "submitted");
          setReviewScheduleId((prev) => {
            if (prev && submittedSchedules.some((s) => s.schedule_id === prev)) return prev;
            return submittedSchedules[0]?.schedule_id ?? null;
          });
        } else {
          setReviewScheduleId(null);
        }
      } else {
        setSchedules([]);
        setReviewScheduleId(null);
      }
    } catch {
      setSchedules([]);
      setReviewScheduleId(null);
    } finally {
      setLoading(false);
    }
  }, [currentWeek, currentYear, canReviewAsKHTH]);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  // ─── Navigation ────────────────────────────────────────────────────────

  const goToPrevWeek = () => {
    if (currentWeek === 1) {
      setCurrentYear((y) => y - 1);
      setCurrentWeek(isoWeeksInYear(currentYear - 1));
    } else {
      setCurrentWeek((w) => w - 1);
    }
  };

  const goToNextWeek = () => {
    if (currentWeek >= isoWeeksInYear(currentYear)) {
      setCurrentYear((y) => y + 1);
      setCurrentWeek(1);
    } else {
      setCurrentWeek((w) => w + 1);
    }
  };

  const submittedSchedules = canReviewAsKHTH
    ? schedules.filter((s) => s.status === "submitted")
    : [];

  const approvedSchedules = schedules.filter((s) => s.status === "approved");

  const reviewSchedule = canReviewAsKHTH
    ? submittedSchedules.find((s) => s.schedule_id === reviewScheduleId) ?? submittedSchedules[0] ?? null
    : null;

  const mergedApprovedSchedule = approvedSchedules.length > 0
    ? {
        schedule_id: `master-${currentWeek}-${currentYear}`,
        week: currentWeek,
        year: currentYear,
        status: "approved",
        owner_department_name: "KHTH",
        source_department_name: "Toàn viện",
        is_master: true,
        shifts: approvedSchedules.flatMap((s) => s.shifts ?? []),
      }
    : null;

  const schedule = reviewSchedule ?? mergedApprovedSchedule;

  // ─── Export PDF ────────────────────────────────────────────────────────

  const handleExportPdf = async () => {
    if (!schedule) return;
    setExporting(true);
    try {
      let result;

      if (schedule.is_master) {
        const res = await exportMasterDutySchedulePdf(currentWeek, currentYear);
        if (res.success && res.data) {
          const filename = `Master_Duty_Schedule_Week_${currentWeek}_${currentYear}.pdf`;
          const url = URL.createObjectURL(res.data);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = filename;
          anchor.style.display = "none";
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          setTimeout(() => URL.revokeObjectURL(url), 10_000);
          result = { success: true, message: filename };
        } else {
          result = { success: false, message: res.message ?? "Xuất PDF thất bại" };
        }
      } else {
        result = await downloadSchedulePdf(schedule);
      }

      if (result.success) {
        message.success(
          schedule.is_master
            ? `Đã tải xuống Master_Duty_Schedule_Week_${currentWeek}_${currentYear}.pdf`
            : `Đã tải xuống Duty_Schedule_Week_${schedule.week}_${schedule.year}.pdf`
        );
      } else {
        message.error(result.message ?? "Xuất PDF thất bại");
      }
    } finally {
      setExporting(false);
    }
  };

  const handleApproveSchedule = async () => {
    if (!reviewSchedule?.schedule_id) return;
    try {
      await approveMutation.mutateAsync(reviewSchedule.schedule_id);
      fetchSchedule();
    } catch {
      // toast is shown in mutation hook
    }
  };

  // ─── Derived: shifts for a given date (optionally filtered by dept) ────

  const shiftsForDate = (dateStr) => {
    if (!schedule?.shifts) return [];
    return schedule.shifts.filter((s) => {
      if (normaliseDate(s.shift_date) !== dateStr) return false;
      if (deptFilter !== "all" && String(s.department_id) !== deptFilter) return false;
      return true;
    });
  };

  // Unique departments in this schedule's shifts
  const departments = Array.from(
    new Map(
      (schedule?.shifts ?? []).map((s) => [
        s.department_id,
        { id: s.department_id, name: s.department_name ?? `Phòng ${s.department_id}` },
      ])
    ).values()
  );

  // Is the logged-in user assigned to any shift on a given date?
  const userShiftIds = new Set(
    (schedule?.shifts ?? [])
      .flatMap((s) => s.assignments ?? [])
      .filter((a) => a.user_id === user?.id)
      .map((a) => a.shift_id)
  );
  const isUserAssignedOnDate = (dateStr) =>
    (schedule?.shifts ?? []).some(
      (s) =>
        normaliseDate(s.shift_date) === dateStr &&
        userShiftIds.has(s.shift_id)
    );

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="p-4">
      {/* ── Page header ────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Title level={4} style={{ margin: 0 }}>
          <CalendarOutlined className="mr-2" />
          Lịch Trực — Tuần {currentWeek} / {currentYear}
        </Title>

        <Space wrap>
          {!schedule?.is_master && departments.length > 0 && (
            <Select
              value={deptFilter}
              onChange={setDeptFilter}
              size="small"
              style={{ minWidth: 160 }}
            >
              <Option value="all">Tất cả phòng ban</Option>
              {departments.map((d) => (
                <Option key={d.id} value={String(d.id)}>
                  {d.name}
                </Option>
              ))}
            </Select>
          )}

          <Tooltip title={!schedule ? "Chưa có lịch được duyệt" : "Tải về PDF"}>
            <Button
              icon={<FilePdfOutlined />}
              onClick={handleExportPdf}
              loading={exporting}
              disabled={!schedule}
              type="default"
            >
              Xuất PDF
            </Button>
          </Tooltip>

          {canReviewAsKHTH && submittedSchedules.length > 0 && (
            <>
              <Select
                value={reviewSchedule?.schedule_id}
                onChange={setReviewScheduleId}
                size="small"
                style={{ minWidth: 240 }}
              >
                {submittedSchedules.map((s) => (
                  <Option key={s.schedule_id} value={s.schedule_id}>
                    {`${s.source_department_name ?? `Phòng ${s.source_department_id}`} · Tuần ${s.week}/${s.year}`}
                  </Option>
                ))}
              </Select>

              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={approveMutation.isPending}
                onClick={handleApproveSchedule}
              >
                Duyệt lịch đã chọn
              </Button>
            </>
          )}
        </Space>
      </div>

      {/* ── Week navigator ──────────────────────────────────────── */}
      <Card size="small" className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button icon={<LeftOutlined />}  size="small" onClick={goToPrevWeek} />
          <Button
            size="small"
            onClick={() => {
              setCurrentWeek(dayjs().isoWeek());
              setCurrentYear(dayjs().year());
            }}
          >
            Tuần hiện tại
          </Button>
          <Button icon={<RightOutlined />} size="small" onClick={goToNextWeek} />

          <Text type="secondary" style={{ fontSize: 12 }}>
            {days[0].format("DD/MM/YYYY")} — {days[6].format("DD/MM/YYYY")}
          </Text>

          {schedule && (
            <Tag
              icon={<CheckCircleOutlined />}
              color={schedule.is_master ? "success" : (schedule.status === "submitted" ? "processing" : "success")}
              style={{ marginLeft: "auto" }}
            >
              {schedule.is_master
                ? "Lịch tổng hợp toàn viện"
                : (schedule.status === "submitted" ? "Đã gửi KHTH" : "Đã duyệt")}
              {" · "}
              {schedule.source_department_name ?? schedule.owner_department_name ?? "KHTH"}
            </Tag>
          )}
        </div>
      </Card>

      {/* ── Body ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spin size="large" />
        </div>
      ) : !schedule ? (
        <Card>
          <Empty
            description={
              <Text type="secondary">
                {canReviewAsKHTH
                  ? `Chưa có lịch trực đã gửi/được duyệt cho tuần ${currentWeek} / ${currentYear}.`
                  : `Chưa có lịch trực được duyệt cho tuần ${currentWeek} / ${currentYear}.`}
              </Text>
            }
          />
        </Card>
      ) : schedule.is_master ? (
        <MasterMergedScheduleTable
          schedule={schedule}
          days={days}
        />
      ) : (
        <Row gutter={[8, 8]}>
          {days.map((day, idx) => {
            const dateStr  = day.format("YYYY-MM-DD");
            const shifts   = shiftsForDate(dateStr);
            const isToday  = day.isSame(dayjs(), "day");
            const hasMine  = isUserAssignedOnDate(dateStr);

            return (
              <Col
                key={dateStr}
                xs={24} sm={12} md={8} lg={6} xl={3}
                style={{ minWidth: 158 }}
              >
                <Card
                  size="small"
                  style={{
                    borderTop: isToday
                      ? "3px solid #1677ff"
                      : hasMine
                      ? "3px solid #52c41a"
                      : "3px solid #d9d9d9",
                    height: "100%",
                  }}
                  title={
                    <div className="text-center leading-tight">
                      <div style={{ fontSize: 11, fontWeight: 600 }}>
                        {DAY_NAMES[idx]}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: isToday ? "#1677ff" : "#888",
                          fontWeight: isToday ? 700 : 400,
                        }}
                      >
                        {day.format("DD/MM")}
                      </div>
                      {hasMine && (
                        <Badge
                          color="green"
                          text={
                            <Text style={{ fontSize: 10, color: "#52c41a" }}>
                              Ca của bạn
                            </Text>
                          }
                        />
                      )}
                    </div>
                  }
                  styles={{ body: { padding: "6px" } }}
                >
                  {shifts.length === 0 ? (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Không có ca trực
                    </Text>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {shifts.map((shift) => (
                        <ReadOnlyShiftCard
                          key={shift.shift_id}
                          shift={shift}
                          currentUserId={user?.id}
                        />
                      ))}
                    </div>
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
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
          name: shift.department_name ?? `Phòng ${shift.department_id}`,
          code: shift.department_code ?? "",
        },
      ]),
    ).values(),
  ).sort((a, b) => {
    const left = `${a.code} ${a.name}`.trim().toUpperCase();
    const right = `${b.code} ${b.name}`.trim().toUpperCase();
    return left.localeCompare(right);
  });

  const shiftsByDayAndDept = new Map();
  for (const shift of schedule?.shifts ?? []) {
    const date = normaliseDate(shift.shift_date);
    const key = `${date}::${shift.department_id}`;
    if (!shiftsByDayAndDept.has(key)) {
      shiftsByDayAndDept.set(key, []);
    }
    shiftsByDayAndDept.get(key).push(shift);
  }

  for (const list of shiftsByDayAndDept.values()) {
    list.sort((left, right) => {
      const timeCompare = String(left.start_time ?? "").localeCompare(String(right.start_time ?? ""));
      if (timeCompare !== 0) return timeCompare;
      return (SHIFT_TYPE_ORDER[left.shift_type] ?? 99) - (SHIFT_TYPE_ORDER[right.shift_type] ?? 99);
    });
  }

  if (departments.length === 0) {
    return (
      <Card>
        <Empty description="Chưa có dữ liệu lịch tổng hợp toàn viện" />
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: Math.max(900, departments.length * 220) }}>
          <thead>
            <tr>
              <th className="border border-slate-200 bg-slate-50 p-2 text-left text-xs font-semibold sticky left-0 z-10">
                Thứ / Ngày
              </th>
              {departments.map((department) => (
                <th
                  key={department.id}
                  className="border border-slate-200 bg-slate-50 p-2 text-left text-xs font-semibold"
                >
                  {department.name}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {days.map((day, idx) => {
              const date = day.format("YYYY-MM-DD");
              const isToday = day.isSame(dayjs(), "day");
              return (
                <tr key={date}>
                  <td className="border border-slate-200 p-2 align-top bg-white sticky left-0 z-10">
                    <div className="text-xs font-semibold" style={{ color: isToday ? "#1677ff" : undefined }}>
                      {DAY_NAMES[idx]}
                    </div>
                    <div className="text-xs text-slate-500">{day.format("DD/MM")}</div>
                  </td>

                  {departments.map((department) => {
                    const key = `${date}::${department.id}`;
                    const shifts = shiftsByDayAndDept.get(key) ?? [];

                    return (
                      <td key={key} className="border border-slate-200 p-2 align-top" style={{ minWidth: 220 }}>
                        {shifts.length === 0 ? (
                          <Text type="secondary" style={{ fontSize: 11 }}>—</Text>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {shifts.map((shift) => (
                              <div
                                key={shift.shift_id}
                                style={{
                                  borderLeft: `3px solid ${SHIFT_COLORS[shift.shift_type] ?? "#666"}`,
                                  borderRadius: 5,
                                  padding: "4px 6px",
                                  background: SHIFT_BG[shift.shift_type] ?? "#fafafa",
                                }}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <Text strong style={{ fontSize: 10, color: SHIFT_COLORS[shift.shift_type] ?? "#666" }}>
                                    {SHIFT_LABELS[shift.shift_type] ?? shift.shift_type}
                                  </Text>
                                  <Text style={{ fontSize: 10, color: "#666" }}>
                                    {fmtTime(shift.start_time)} – {fmtTime(shift.end_time)}
                                  </Text>
                                </div>

                                <div style={{ fontSize: 10, color: "#888", marginTop: 1 }}>
                                  <TeamOutlined style={{ marginRight: 2 }} />
                                  {(shift.assignments ?? []).length}/{shift.max_staff} người
                                </div>

                                {(shift.assignments ?? []).length > 0 && (
                                  <>
                                    <Divider dashed style={{ margin: "3px 0" }} />
                                    <div className="flex flex-col gap-0.5">
                                      {(shift.assignments ?? []).map((assignment) => (
                                        <Text key={assignment.assignment_id} style={{ fontSize: 10 }} ellipsis>
                                          {assignment.full_name ?? `#${assignment.user_id}`}
                                        </Text>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
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
    </Card>
  );
}

// ─── ReadOnlyShiftCard ────────────────────────────────────────────────────────

function ReadOnlyShiftCard({ shift, currentUserId }) {
  const {
    shift_type, start_time, end_time,
    max_staff, assignments = [], department_name,
  } = shift;

  const color  = SHIFT_COLORS[shift_type] ?? "#666";
  const bgClr  = SHIFT_BG[shift_type]    ?? "#fafafa";
  const label  = SHIFT_LABELS[shift_type] ?? shift_type;
  const isFull = assignments.length >= max_staff;

  return (
    <div
      style={{
        borderLeft: `3px solid ${color}`,
        borderRadius: 5,
        padding: "4px 6px",
        background: bgClr,
        marginBottom: 2,
      }}
    >
      {/* Shift type + time */}
      <div className="flex items-center justify-between gap-1">
        <Text strong style={{ fontSize: 10, color }}>
          {label}
        </Text>
        {isFull && (
          <Tag color="default" style={{ fontSize: 9, padding: "0 3px", margin: 0 }}>
            Đủ
          </Tag>
        )}
      </div>

      <div style={{ fontSize: 10, color: "#888", marginTop: 1 }}>
        <ClockCircleOutlined style={{ marginRight: 2 }} />
        {fmtTime(start_time)} – {fmtTime(end_time)}
      </div>

      {/* Department label (useful when "all depts" filter is active) */}
      {department_name && (
        <div style={{ fontSize: 9, color: "#aaa", marginTop: 1 }}>
          {department_name}
        </div>
      )}

      {/* Capacity */}
      <div style={{ fontSize: 10, color: "#888", marginTop: 1 }}>
        <TeamOutlined style={{ marginRight: 2 }} />
        {assignments.length}/{max_staff} người
      </div>

      {/* Staff list */}
      {assignments.length > 0 && (
        <>
          <Divider dashed style={{ margin: "3px 0" }} />
          <div className="flex flex-col gap-0.5">
            {assignments.map((a) => {
              const isMe = a.user_id === currentUserId;
              return (
                <Tooltip
                  key={a.assignment_id}
                  title={a.employee_code ? `Mã: ${a.employee_code}` : undefined}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: isMe ? 700 : 400,
                      color: isMe ? "#1677ff" : "inherit",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "block",
                    }}
                  >
                    {isMe ? "▶ " : ""}{a.full_name ?? `#${a.user_id}`}
                  </Text>
                </Tooltip>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
