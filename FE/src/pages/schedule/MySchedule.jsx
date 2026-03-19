import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Badge, Modal, Typography, Button, Input, TimePicker, Checkbox, Form, Tag, Tooltip, Layout, Menu, Popconfirm, Select, Dropdown } from 'antd';
import { Plus, Calendar as CalendarIcon, Clock, AlignLeft, MapPin, Trash2, X, ChevronLeft, ChevronRight, Menu as MenuIcon } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Import service
import userScheduleService from '../../services/userScheduleService';

dayjs.locale('vi');
dayjs.extend(customParseFormat);

const { Title, Text } = Typography;
const { Sider, Content } = Layout;
const { TextArea } = Input;

const COLORS = {
    personal: { bg: '#039be5', text: '#fff' }, // Google Blue
    duty: { bg: '#d50000', text: '#fff' },     // Google Red
    weekly: { bg: '#33b679', text: '#fff' },   // Google Green
};

const MySchedule = () => {
    // State
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [currentMonth, setCurrentMonth] = useState(dayjs()); // Track view month separately
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [personalEvents, setPersonalEvents] = useState([]);
    const [visibleCalendars, setVisibleCalendars] = useState({
        personal: true,
        duty: true,
        weekly: true,
    });
    const [form] = Form.useForm();

    // API data state
    const [dutySchedules, setDutySchedules] = useState([]);
    const [weeklyWorkItems, setWeeklyWorkItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch user's schedule data on component mount
    useEffect(() => {
        const fetchScheduleData = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('Fetching schedule data for current user...');

                const [dutyRes, weeklyRes] = await Promise.all([
                    userScheduleService.getUserDutySchedules(),
                    userScheduleService.getUserWeeklyWorkItems()
                ]);

                console.log('Duty Schedules Response:', dutyRes);
                console.log('Weekly Work Items Response:', weeklyRes);

                if (dutyRes.success) {
                    console.log(`Loaded ${dutyRes.data.length} duty schedules`);
                    setDutySchedules(dutyRes.data);
                }

                if (weeklyRes.success) {
                    console.log(`Loaded ${weeklyRes.data.length} weekly work items`);
                    setWeeklyWorkItems(weeklyRes.data);
                }

                if (dutyRes.data?.length === 0 && weeklyRes.data?.length === 0) {
                    setError('Bạn chưa được gán lịch hoặc công tác nào. Liên hệ với quản lý để được gán lịch.');
                }
            } catch (err) {
                console.error('Failed to fetch schedule data:', err);
                setError(err.message || 'Lỗi tải dữ liệu lịch');
            } finally {
                setLoading(false);
            }
        };

        fetchScheduleData();
    }, []);

    // Derived Events (memoized to avoid setState in effect)
    const allEvents = useMemo(() => {
        const events = [];

        // 1. Sync from Duty Schedule API
        if (visibleCalendars.duty && dutySchedules.length > 0) {
            dutySchedules.forEach(shift => {
                events.push({
                    id: `duty-${shift.shift_id}-${shift.shift_date}`,
                    date: shift.shift_date,
                    title: `${shift.shift_type === 'morning' ? 'Sáng' : shift.shift_type === 'afternoon' ? 'Chiều' : 'Tối'}: Trực`,
                    type: 'duty',
                    color: 'duty',
                    details: `${shift.start_time} - ${shift.end_time} | ${shift.department_name || 'N/A'}`,
                    time: shift.start_time
                });
            });
        }

        // 2. Sync from Weekly Work Items API
        if (visibleCalendars.weekly && weeklyWorkItems.length > 0) {
            weeklyWorkItems.forEach(item => {
                events.push({
                    id: `weekly-${item.weekly_work_item_id}`,
                    date: item.work_date,
                    title: `${item.time_period}: Công tác`,
                    type: 'weekly',
                    color: 'weekly',
                    details: item.content,
                    location: item.location,
                    participants: item.participants
                });
            });
        }

        // 3. Personal Notes
        if (visibleCalendars.personal) {
            events.push(...personalEvents);
        }

        return events;
    }, [visibleCalendars, personalEvents, dutySchedules, weeklyWorkItems]);

    // --- HANDLERS ---

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setCurrentMonth(date);
    };

    const handlePanelChange = (date) => {
        setCurrentMonth(date);
    }

    const handleAddEvent = (values) => {
        // Convert date string (from HTML input) to YYYY-MM-DD format
        const dateStr = typeof values.date === 'string' 
            ? values.date 
            : dayjs(values.date).format('YYYY-MM-DD');

        const newEvent = {
            id: `personal-${Date.now()}`,
            date: dateStr,
            title: values.title,
            type: 'personal',
            color: 'personal',
            details: values.description,
            time: values.time ? values.time.format('HH:mm') : 'All Day'
        };
        setPersonalEvents([...personalEvents, newEvent]);
        setIsAddModalOpen(false);
        form.resetFields();
    };

    const handleEventClick = (e, event) => {
        e.stopPropagation();
        setSelectedEvent(event);
        setIsDetailModalOpen(true);
    };

    const handleDeleteEvent = () => {
        if (selectedEvent && selectedEvent.type === 'personal') {
            const updatedEvents = personalEvents.filter(ev => ev.id !== selectedEvent.id);
            setPersonalEvents(updatedEvents);
            setIsDetailModalOpen(false);
            setSelectedEvent(null);
        }
    };

    const cellRender = (current, info) => {
        if (info.type === 'date') {
            const dateStr = current.format('YYYY-MM-DD');
            const dayEvents = allEvents.filter(e => e.date === dateStr);

            return (
                <ul className="events p-0 m-0 list-none space-y-0.5 mt-0.5" onClick={(event) => event.stopPropagation()}>
                    {dayEvents.map((item) => {
                        const style = COLORS[item.color];
                        return (
                            <li key={item.id}>
                                <Tooltip title={item.title + (item.time ? ` · ${item.time}` : "")}>
                                    <div
                                        className="px-2 py-0.5 text-xs font-medium cursor-pointer transition-all hover:brightness-90 flex items-center gap-1 truncate rounded-[4px]"
                                        style={{
                                            backgroundColor: style.bg,
                                            color: style.text,
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                        }}
                                        onClick={(e) => handleEventClick(e, item)}
                                    >
                                        <span className="truncate font-semibold text-[11px] leading-tight">
                                            {item.time && item.time !== 'All Day' ? <span className="opacity-90 mr-1 font-normal">{item.time}</span> : null}
                                            {item.title}
                                        </span>
                                    </div>
                                </Tooltip>
                            </li>
                        )
                    })}
                </ul>
            );
        }
        return info.originNode;
    };

    return (
        <Layout className="h-[calc(100vh-80px)] bg-white overflow-hidden flex flex-col">
            {/* Custom Google-like Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white shrink-0 h-16">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <CalendarIcon size={24} className="text-blue-600 mb-1" />
                        <span className="text-2xl font-normal text-slate-700">Lịch Cá Nhân</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button onClick={() => {
                            const today = dayjs();
                            setSelectedDate(today);
                            setCurrentMonth(today);
                        }}>Hôm nay</Button>
                        <Button type="text" shape="circle" icon={<ChevronLeft size={20} />} onClick={() => setCurrentMonth(currentMonth.add(-1, 'month'))} />
                        <Button type="text" shape="circle" icon={<ChevronRight size={20} />} onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))} />
                        <span className="text-xl font-medium text-slate-800 ml-2 capitalize w-40">
                            {currentMonth.format('MMMM YYYY')}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Select defaultValue="month" style={{ width: 100 }} variant="borderless">
                        <Select.Option value="month">Tháng</Select.Option>
                        <Select.Option value="week">Tuần</Select.Option>
                        <Select.Option value="day">Ngày</Select.Option>
                    </Select>
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                        BT
                    </div>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-red-50 border-b border-red-200 px-6 py-3 text-red-700 flex items-center justify-between">
                    <span>{error}</span>
                    <Button type="text" size="small" onClick={() => setError(null)}>
                        Đóng
                    </Button>
                </div>
            )}

            <Layout className="flex-1 overflow-hidden">
                {/* Sidebar / Filters - Cleaner Look */}
                <Sider width={260} theme="light" className="p-4 hidden md:block border-r border-slate-100 overflow-y-auto">
                    <div className="mb-6">
                        <Button
                            type="text"
                            className="h-12 rounded-full shadow-md border hover:bg-slate-50 flex items-center gap-3 px-4 transition-all hover:shadow-lg bg-white"
                            onClick={() => {
                                form.setFieldValue('date', selectedDate.format('YYYY-MM-DD'));
                                setIsAddModalOpen(true);
                            }}
                        >
                            <Plus size={24} className="text-red-500" />
                            <span className="text-base font-medium text-slate-700">Tạo mới</span>
                        </Button>
                    </div>

                    <div className="mb-6">
                        <Calendar fullscreen={false} value={selectedDate} onSelect={handleDateSelect} />
                    </div>

                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-3 px-2">Lịch của tôi</p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer transition-colors">
                                <Checkbox
                                    checked={visibleCalendars.personal}
                                    onChange={(e) => setVisibleCalendars({ ...visibleCalendars, personal: e.target.checked })}
                                    style={{ accentColor: COLORS.personal.bg }}
                                />
                                <span className="text-sm text-slate-700 font-medium">Cá nhân</span>
                            </div>
                            <div className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer transition-colors">
                                <Checkbox
                                    checked={visibleCalendars.duty}
                                    onChange={(e) => setVisibleCalendars({ ...visibleCalendars, duty: e.target.checked })}
                                />
                                <span className="text-sm text-slate-700 font-medium">Lịch Trực Bệnh Viện</span>
                            </div>
                            <div className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer transition-colors">
                                <Checkbox
                                    checked={visibleCalendars.weekly}
                                    onChange={(e) => setVisibleCalendars({ ...visibleCalendars, weekly: e.target.checked })}
                                />
                                <span className="text-sm text-slate-700 font-medium">Lịch Công Tác Tuần</span>
                            </div>
                        </div>
                    </div>
                </Sider>

                {/* Main Calendar Content */}
                <Content className="bg-white flex-1 relative custom-calendar-wrapper">
                    <Calendar
                        value={currentMonth}
                        cellRender={cellRender}
                        onSelect={handleDateSelect}
                        onPanelChange={handlePanelChange}
                        headerRender={() => null} // Hide default header
                        className="custom-calendar h-full"
                    />
                </Content>
            </Layout>

            {/* Add Event Modal */}
            <Modal
                title={null}
                open={isAddModalOpen}
                onCancel={() => setIsAddModalOpen(false)}
                footer={null}
                width={450}
                centered
                className="rounded-lg overflow-hidden"
                closeIcon={<div className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-500" /></div>}
            >
                <Form form={form} layout="vertical" onFinish={handleAddEvent} className="pt-2">
                    <Form.Item name="title" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]} className="mb-4">
                        <Input placeholder="Thêm tiêu đề và thời gian" className="text-xl border-0 border-b-2 border-slate-100 rounded-none px-0 focus:shadow-none focus:border-blue-500 hover:border-slate-300 transition-colors pb-2" />
                    </Form.Item>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 flex justify-center"><Clock size={20} className="text-slate-400" /></div>
                        <div className="flex gap-2 flex-1">
                            <Form.Item name="date" className="mb-0 flex-1" rules={[{ required: true }]}>
                                <Input type="date" className="bg-slate-50 border-0 rounded hover:bg-slate-100" />
                            </Form.Item>
                            <Form.Item name="time" className="mb-0 flex-1">
                                <TimePicker format="HH:mm" className="w-full bg-slate-50 border-0 hover:bg-slate-100" placeholder="Cả ngày" showNow={false} suffixIcon={null} />
                            </Form.Item>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-10 flex justify-center mt-2.5"><AlignLeft size={20} className="text-slate-400" /></div>
                        <Form.Item name="description" className="mb-0 flex-1">
                            <TextArea
                                placeholder="Thêm mô tả"
                                autoSize={{ minRows: 3, maxRows: 6 }}
                                className="bg-slate-50 border-0 hover:bg-slate-100 rounded"
                            />
                        </Form.Item>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="primary" htmlType="submit" className="bg-blue-600 h-9 font-medium px-6">Lưu</Button>
                    </div>
                </Form>
            </Modal>

            {/* Event Detail Modal */}
            <Modal
                title={null}
                open={isDetailModalOpen}
                onCancel={() => setIsDetailModalOpen(false)}
                footer={null}
                centered
                closeIcon={<div className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-500" /></div>}
                width={400}
            >
                {selectedEvent && (
                    <div className="pt-1">
                        <div className="flex gap-4 items-start mb-6">
                            <div className="w-4 h-4 mt-1.5 rounded-[4px] shrink-0" style={{ backgroundColor: COLORS[selectedEvent.color].bg }} />
                            <div>
                                <h2 className="text-xl font-normal text-slate-800 mb-1 leading-snug">{selectedEvent.title}</h2>
                                <p className="text-slate-500 text-sm">
                                    {dayjs(selectedEvent.date).format('dddd, DD [tháng] MM')}
                                    {selectedEvent.time && selectedEvent.time !== 'All Day' && ` · ${selectedEvent.time}`}
                                </p>
                            </div>
                        </div>

                        {selectedEvent.details && (
                            <div className="flex gap-4 mb-6">
                                <AlignLeft size={18} className="text-slate-400 shrink-0 mt-0.5" />
                                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed text-sm">{selectedEvent.details}</p>
                            </div>
                        )}

                        {/* Actions */}
                        {selectedEvent.type === 'personal' && (
                            <div className="flex justify-end mt-4 pt-2">
                                <Popconfirm
                                    title="Xoá lịch này?"
                                    onConfirm={handleDeleteEvent}
                                    okText="Xoá"
                                    cancelText="Hủy"
                                    okButtonProps={{ danger: true }}
                                >
                                    <Button type="text" danger icon={<Trash2 size={18} />} className="flex items-center hover:bg-red-50" />
                                </Popconfirm>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <style jsx global>{`
                /* Override Ant Design Calendar to look like Google Calendar */
                .custom-calendar-wrapper .ant-picker-calendar {
                     background: white;
                }
                .custom-calendar-wrapper .ant-picker-panel {
                    border: none !important;
                }
                .custom-calendar-wrapper .ant-picker-calendar-mode-switch {
                    display: none; /* Hide default selector */
                }
                .custom-calendar-wrapper .ant-picker-calendar-month-select {
                    display: none;
                }
                .custom-calendar-wrapper .ant-picker-calendar-year-select {
                    display: none;
                }
                
                /* Grid Lines */
                .custom-calendar-wrapper .ant-picker-cell {
                    border-bottom: 1px solid #e5e7eb !important; /* Tailwind slate-200 */
                    border-right: 1px solid #e5e7eb !important;
                    position: relative;
                }
                
                /* Cell Content Area */
                .custom-calendar-wrapper .ant-picker-cell-inner {
                    padding: 0 !important;
                    margin: 0 !important;
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                }

                .custom-calendar-wrapper .ant-picker-calendar-date {
                    margin: 0 !important;
                    padding: 4px !important;
                    height: 100% !important;
                }

                .custom-calendar-wrapper .ant-picker-calendar-date-value {
                    text-align: center;
                    font-size: 12px;
                    font-weight: 500;
                    color: #4b5563;
                    margin-bottom: 2px;
                }

                /* Today Highlight */
                .custom-calendar-wrapper .ant-picker-calendar-date-today .ant-picker-calendar-date-value {
                    background: #1a73e8;
                    color: white;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    line-height: 24px;
                    margin: 0 auto 4px auto;
                    display: block;
                    padding: 0;
                }

                /* Header Days (Mon, Tue, Wed...) */
                .custom-calendar-wrapper th {
                    text-transform: uppercase;
                    font-size: 11px;
                    color: #6b7280;
                    font-weight: 600;
                    padding: 8px 0 !important;
                    border-bottom: 1px solid #e5e7eb;
                }
                
                .events li {
                    list-style: none;
                }
            `}</style>
        </Layout>
    );
};

export default MySchedule;
