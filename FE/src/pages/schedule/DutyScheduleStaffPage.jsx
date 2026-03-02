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
import { getSchedulesByWeek } from "../../modules/schedule/api/scheduleApi";
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
  const [schedule,    setSchedule]    = useState(null);
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
        // KHTH sees submitted+approved (prioritize submitted for review).
        // Other users only see approved schedules.
        const visible = canReviewAsKHTH
          ? list.filter((s) => s.status === "submitted" || s.status === "approved")
          : list.filter((s) => s.status === "approved");

        const submitted = visible.find((s) => s.status === "submitted") ?? null;
        const found = canReviewAsKHTH
          ? (submitted ?? visible[0] ?? null)
          : (visible.find((s) => s.source_department_id === user?.departmentId) ?? visible[0] ?? null);
        setSchedule(found);
      } else {
        setSchedule(null);
      }
    } catch {
      setSchedule(null);
    } finally {
      setLoading(false);
    }
  }, [currentWeek, currentYear, user?.departmentId, canReviewAsKHTH]);

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

  // ─── Export PDF ────────────────────────────────────────────────────────

  const handleExportPdf = async () => {
    if (!schedule) return;
    setExporting(true);
    try {
      const result = await downloadSchedulePdf(schedule);
      if (result.success) {
        message.success(
          `Đã tải xuống Duty_Schedule_Week_${schedule.week}_${schedule.year}.pdf`
        );
      } else {
        message.error(result.message ?? "Xuất PDF thất bại");
      }
    } finally {
      setExporting(false);
    }
  };

  const handleApproveSchedule = async () => {
    if (!schedule?.schedule_id) return;
    try {
      await approveMutation.mutateAsync(schedule.schedule_id);
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
          {departments.length > 0 && (
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

          {canReviewAsKHTH && schedule?.status === "submitted" && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={approveMutation.isPending}
              onClick={handleApproveSchedule}
            >
              Duyệt lịch
            </Button>
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
              color={schedule.status === "submitted" ? "processing" : "success"}
              style={{ marginLeft: "auto" }}
            >
              {schedule.status === "submitted" ? "Đã gửi KHTH" : "Đã duyệt"}
              {" · "}
              {schedule.owner_department_name ?? "KHTH"}
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
