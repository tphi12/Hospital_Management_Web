import { useState, useEffect, useCallback } from "react";
import {
  Button, Card, Col, Form, Input, InputNumber,
  message, Modal, Row, Select, Spin, Tag, TimePicker,
  Typography, Empty, Badge, Space,
} from "antd";
import {
  PlusOutlined, SendOutlined,
  LeftOutlined, RightOutlined, CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { useAuth } from "../../hooks/useAuth";
import { userService } from "../../services";
import { getSchedulesByWeek } from "../../modules/schedule/api/scheduleApi";
import {
  useCreateScheduleMutation,
  useSubmitScheduleMutation,
  useAddShiftMutation,
} from "../../modules/schedule/hooks/useScheduleQuery";
import ScheduleTable from "../../modules/schedule/components/ScheduleTable";

dayjs.extend(isoWeek);

/** A year has 53 ISO weeks if Jan 1 or Dec 31 falls on a Thursday. */
function isoWeeksInYear(year) {
  const jan1  = dayjs(`${year}-01-01`).isoWeekday();
  const dec31 = dayjs(`${year}-12-31`).isoWeekday();
  return jan1 === 4 || dec31 === 4 ? 53 : 52;
}

const { Title, Text } = Typography;
const { Option } = Select;

// ─── Constants ─────────────────────────────────────────────────────────────────

const SHIFT_TYPE_LABELS = {
  morning:   "Ca sáng",
  afternoon: "Ca chiều",
  night:     "Ca đêm",
};

const STATUS_COLORS = {
  draft:     "default",
  submitted: "processing",
  approved:  "success",
};

const STATUS_LABELS = {
  draft:     "Nháp",
  submitted: "Đã gửi KHTH",
  approved:  "Đã duyệt",
};


/** Return array of 7 dayjs objects for the Mon–Sun of a given week/year. */
function weekDays(week, year) {
  const monday = dayjs().year(year).isoWeek(week).isoWeekday(1);
  return Array.from({ length: 7 }, (_, i) => monday.add(i, "day"));
}

// ─── DutyScheduleClerkPage ────────────────────────────────────────────────────

export default function DutyScheduleClerkPage() {
  const { user } = useAuth();

  // ── Week state ───────────────────────────────────────────────────────────
  const [currentWeek, setCurrentWeek] = useState(() => dayjs().isoWeek());
  const [currentYear, setCurrentYear] = useState(() => dayjs().year());

  // ── Schedule data ────────────────────────────────────────────────────────
  const [schedule, setSchedule] = useState(null);   // null = not found
  const [loading, setLoading]   = useState(false);

  // ── Staff list for assignment modal ──────────────────────────────────────
  const [staffList, setStaffList] = useState([]);

  // ── Modal visibility ──────────────────────────────────────────────────────
  const [createModalOpen,   setCreateModalOpen]   = useState(false);
  const [addShiftModalOpen, setAddShiftModalOpen] = useState(false);

  // ── Active date for the add-shift modal ───────────────────────────────────
  const [activeDate, setActiveDate] = useState(null);   // 'YYYY-MM-DD'

  // ── Forms ────────────────────────────────────────────────────────────────
  const [createForm] = Form.useForm();
  const [shiftForm]  = Form.useForm();

  // ── React Query mutations ─────────────────────────────────────────────────
  const createMutation   = useCreateScheduleMutation();
  const submitMutation   = useSubmitScheduleMutation();
  const addShiftMutation = useAddShiftMutation();
  /** True while any background mutation is in-flight — disables action buttons */
  const anyMutating =
    createMutation.isPending ||
    submitMutation.isPending ||
    addShiftMutation.isPending;

  // ── Derived ───────────────────────────────────────────────────────────────
  const days = weekDays(currentWeek, currentYear);

  const isSourceDept =
    schedule && user?.departmentId === schedule.source_department_id;

  const canSubmit =
    schedule?.status === "draft" && isSourceDept;

  // ─── Data fetching ────────────────────────────────────────────────────────

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSchedulesByWeek(currentWeek, currentYear, "duty");
      if (res.success) {
        const list = res.data ?? [];
        // Pick the schedule owned by the current user's department, or any
        const found = list.find(
          (s) => s.source_department_id === user?.departmentId
        ) ?? list[0] ?? null;
        setSchedule(found);
      } else {
        message.error(res.message ?? "Không thể tải lịch trực");
        setSchedule(null);
      }
    } catch {
      message.error("Lỗi kết nối máy chủ");
      setSchedule(null);
    } finally {
      setLoading(false);
    }
  }, [currentWeek, currentYear, user?.departmentId]);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  const fetchStaff = useCallback(async () => {
    if (!user?.departmentId) return;
    try {
      const res = await userService.getAllUsers({ department_id: user.departmentId });
      const list = res.data ?? res ?? [];
      setStaffList(Array.isArray(list) ? list : []);
    } catch {
      /* non-critical — staff list just won't populate */
    }
  }, [user?.departmentId]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  // ─── Navigation ───────────────────────────────────────────────────────────

  const goToPrevWeek = () => {
    if (currentWeek === 1) {
      setCurrentWeek(52);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentWeek((w) => w - 1);
    }
  };

  const goToNextWeek = () => {
    const weeksInYear = isoWeeksInYear(currentYear);
    if (currentWeek >= weeksInYear) {
      setCurrentWeek(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentWeek((w) => w + 1);
    }
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(dayjs().isoWeek());
    setCurrentYear(dayjs().year());
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleCreateSchedule = async () => {
    let values;
    try { values = await createForm.validateFields(); }
    catch { return; /* antd shows inline field errors */ }

    try {
      await createMutation.mutateAsync({
        week:        currentWeek,
        year:        currentYear,
        description: values.description,
      });
      // toast shown by hook's onSuccess
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchSchedule(); // sync local state (RQ invalidation covers RQ consumers)
    } catch {
      // toast shown by hook's onError
    }
  };

  const handleAddShift = async () => {
    let values;
    try { values = await shiftForm.validateFields(); }
    catch { return; }

    try {
      await addShiftMutation.mutateAsync({
        schedule_id:   schedule.schedule_id,
        department_id: user.departmentId,
        shift_date:    activeDate,
        shift_type:    values.shift_type,
        start_time:    values.start_time.format("HH:mm"),
        end_time:      values.end_time.format("HH:mm"),
        max_staff:     values.max_staff,
        notes:         values.notes,
        staff_ids:     values.staff_ids,
      });
      // toast shown by hook's onSuccess
      setAddShiftModalOpen(false);
      shiftForm.resetFields();
      fetchSchedule();
    } catch {
      /* toast shown by hook's onError */
    }
  };

  const handleSubmitSchedule = () => {
    Modal.confirm({
      title:   "Xác nhận gửi lịch",
      content: "Sau khi gửi, lịch trực sẽ được chuyển tới phòng KHTH để duyệt. Bạn có chắc chắn không?",
      okText:        "Gửi lịch",
      cancelText:    "Huỷ",
      okButtonProps: { type: "primary" },
      // Returning a Promise makes antd auto-show loading on the OK button
      onOk: async () => {
        await submitMutation.mutateAsync(schedule.schedule_id);
        // toast shown by hook's onSuccess; sync local state
        fetchSchedule();
      },
    });
  };

  const openAddShift = (dateStr) => {
    setActiveDate(dateStr);
    shiftForm.resetFields();
    setAddShiftModalOpen(true);
  };

  const isDraft = schedule?.status === "draft";
  const canEdit = isDraft && isSourceDept;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-4">
      {/* Full-page loading overlay during any mutation */}
      <Spin spinning={anyMutating} fullscreen tip="Đang xử lý..." />

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Title level={4} style={{ margin: 0 }}>
          <CalendarOutlined className="mr-2" />
          Lịch Trực — Tuần {currentWeek} / {currentYear}
        </Title>

        <Space wrap>
          {schedule && (
            <Badge
              status={STATUS_COLORS[schedule.status]}
              text={
                <Text strong>
                  Trạng thái:{" "}
                  <Tag color={
                    schedule.status === "approved" ? "green" :
                    schedule.status === "submitted" ? "blue" : "default"
                  }>
                    {STATUS_LABELS[schedule.status]}
                  </Tag>
                </Text>
              }
            />
          )}

          {canSubmit && (
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSubmitSchedule}
              loading={submitMutation.isPending}
              disabled={anyMutating}
            >
              Gửi KHTH
            </Button>
          )}

          {!schedule && !loading && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
              disabled={anyMutating}
            >
              Tạo lịch trực
            </Button>
          )}
        </Space>
      </div>

      {/* ── Week navigator ───────────────────────────────────────── */}
      <Card size="small" className="mb-4">
        <div className="flex items-center gap-3">
          <Button icon={<LeftOutlined />}  onClick={goToPrevWeek} size="small" />
          <Button onClick={goToCurrentWeek} size="small">Tuần hiện tại</Button>
          <Button icon={<RightOutlined />} onClick={goToNextWeek} size="small" />

          <Text type="secondary" className="ml-2">
            {days[0].format("DD/MM/YYYY")} — {days[6].format("DD/MM/YYYY")}
          </Text>
        </div>
      </Card>

      {/* ── Main content ─────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spin size="large" />
        </div>
      ) : !schedule ? (
        <Card>
          <Empty
            description={
              <span>
                Chưa có lịch trực cho tuần {currentWeek}/{currentYear}.{" "}
                {isSourceDept !== false && (
                  <Button
                    type="link"
                    style={{ padding: 0 }}
                    onClick={() => setCreateModalOpen(true)}
                  >
                    Tạo lịch ngay
                  </Button>
                )}
              </span>
            }
          />
        </Card>
      ) : (
        /* ── Schedule table (3 shift-type rows × 7 day columns) ── */
        <ScheduleTable
          schedule={schedule}
          editable={canEdit}
          onAssigned={fetchSchedule}
          staffList={staffList}
          onAddShift={openAddShift}
        />
      )}

      {/* ── Create schedule modal ────────────────────────────────── */}
      <Modal
        title="Tạo lịch trực mới"
        open={createModalOpen}
        onCancel={() => { setCreateModalOpen(false); createForm.resetFields(); }}
        onOk={handleCreateSchedule}
        okText="Tạo lịch"
        cancelText="Huỷ"
        confirmLoading={createMutation.isPending}
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item label="Tuần">
            <Text strong>Tuần {currentWeek} / {currentYear}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {days[0].format("DD/MM/YYYY")} — {days[6].format("DD/MM/YYYY")}
            </Text>
          </Form.Item>
          <Form.Item name="description" label="Ghi chú (tùy chọn)">
            <Input.TextArea rows={2} placeholder="Nhập ghi chú cho lịch trực..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Add shift modal ──────────────────────────────────────── */}
      <Modal
        title={`Thêm ca trực — ${activeDate ? dayjs(activeDate).format("DD/MM/YYYY") : ""}`}
        open={addShiftModalOpen}
        onCancel={() => { setAddShiftModalOpen(false); shiftForm.resetFields(); }}
        onOk={handleAddShift}
        okText="Thêm ca"
        cancelText="Huỷ"
        confirmLoading={addShiftMutation.isPending}
      >
        <Form form={shiftForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="shift_type"
            label="Loại ca"
            rules={[{ required: true, message: "Vui lòng chọn loại ca" }]}
          >
            <Select placeholder="Chọn ca trực">
              {Object.entries(SHIFT_TYPE_LABELS).map(([val, lbl]) => (
                <Option key={val} value={val}>{lbl}</Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="start_time"
                label="Giờ bắt đầu"
                rules={[{ required: true, message: "Bắt buộc" }]}
              >
                <TimePicker
                  format="HH:mm"
                  minuteStep={15}
                  style={{ width: "100%" }}
                  placeholder="Giờ bắt đầu"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="end_time"
                label="Giờ kết thúc"
                rules={[{ required: true, message: "Bắt buộc" }]}
              >
                <TimePicker
                  format="HH:mm"
                  minuteStep={15}
                  style={{ width: "100%" }}
                  placeholder="Giờ kết thúc"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="max_staff"
            label="Số nhân viên tối đa"
            initialValue={3}
            rules={[{ required: true, message: "Bắt buộc" }]}
          >
            <InputNumber min={1} max={50} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="staff_ids"
            label="Phân công nhân viên ngay (tuỳ chọn)"
          >
            <Select
              mode="multiple"
              showSearch
              placeholder="Chọn nhân viên cùng phòng để phân công ngay"
              optionFilterProp="label"
              options={staffList.map((s) => {
                const id = s.user_id ?? s.id;
                const label =
                  (s.full_name ?? s.username ?? `User #${id}`) +
                  (s.employee_code ? ` (${s.employee_code})` : "");
                return { value: id, label };
              })}
              filterOption={(input, opt) =>
                opt?.label?.toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={2} placeholder="Ghi chú cho ca trực (tuỳ chọn)" />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
}
