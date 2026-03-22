import { useAuth } from "../hooks/useAuth";
import dashboardService from "../services/dashboardService";
import {
    UserOutlined,
    BankOutlined,
    FileTextOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    FileWordOutlined,
    FileExcelOutlined,
    FilePdfOutlined,
    FileImageOutlined
} from "@ant-design/icons";
import { ROLES } from "../lib/roles";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Table, Alert, Typography, Breadcrumb, Space, Spin, message } from "antd";

const { Title, Text } = Typography;

const Dashboard = () => {
    const { user } = useAuth();
    const [showBanner, setShowBanner] = useState(true);

    const [data, setData] = useState({
        summary: { users: 0, departments: 0, documents: 0, schedules: 0 },
        documentTypes: { word: 0, excel: 0, pdf: 0, image: 0 },
        documentsByDepartment: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const res = await dashboardService.getStats();
                if (res.data?.success) {
                    setData(res.data.data);
                } else {
                    message.error("Lỗi khi tải dữ liệu dashboard");
                }
            } catch (error) {
                console.error("Dashboard fetch error:", error);
                message.error("Lỗi khi kết nối với máy chủ");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Derived Data for UI
    const STATS = [
        { label: "Người Dùng", value: data.summary.users, sub: "Đang hoạt động", icon: <UserOutlined />, color: "#1677ff", bg: "#e6f4ff" },
        { label: "Phòng Ban", value: data.summary.departments, sub: "Trên hệ thống", icon: <BankOutlined />, color: "#52c41a", bg: "#f6ffed" },
        { label: "Tài Liệu", value: data.summary.documents, sub: "Tổng số lưu trữ", icon: <FileTextOutlined />, color: "#faad14", bg: "#fffbe6" },
        { label: "Lịch Trực", value: data.summary.schedules, sub: "Đã phê duyệt", icon: <CalendarOutlined />, color: "#eb2f96", bg: "#fff0f6" },
    ];

    const TABLE_DATA = data.documentsByDepartment.map((item, index) => ({
        key: index,
        ...item
    }));

    const DOC_TYPES = [
        { name: 'WORD', count: data.documentTypes.word, color: "#1890ff", icon: <FileWordOutlined /> },
        { name: 'EXCEL', count: data.documentTypes.excel, color: "#52c41a", icon: <FileExcelOutlined /> },
        { name: 'PDF', count: data.documentTypes.pdf, color: "#f5222d", icon: <FilePdfOutlined /> },
        { name: 'IMAGE', count: data.documentTypes.image, color: "#faad14", icon: <FileImageOutlined /> },
    ];

    const PIE_DATA = [
        { name: 'Word', value: data.documentTypes.word, color: '#1890ff' },
        { name: 'Excel', value: data.documentTypes.excel, color: '#52c41a' },
        { name: 'PDF', value: data.documentTypes.pdf, color: '#f5222d' },
        { name: 'Image', value: data.documentTypes.image, color: '#faad14' },
    ].filter(item => item.value > 0);

    const BAR_DATA = TABLE_DATA.map(item => ({
        name: item.name,
        docs: item.total
    })).filter(item => item.docs >= 0).slice(0, 8);

    const columns = [
        { title: 'Phòng Ban', dataIndex: 'name', key: 'name', render: text => <span className="font-medium">{text}</span> },
        { title: 'Word', dataIndex: 'word', key: 'word', align: 'center', render: v => v > 0 ? <Text strong>{v}</Text> : <Text type="secondary">-</Text> },
        { title: 'Excel', dataIndex: 'excel', key: 'excel', align: 'center', render: v => v > 0 ? <Text strong>{v}</Text> : <Text type="secondary">-</Text> },
        { title: 'PDF', dataIndex: 'pdf', key: 'pdf', align: 'center', render: v => v > 0 ? <Text strong>{v}</Text> : <Text type="secondary">-</Text> },
        { title: 'Image', dataIndex: 'image', key: 'image', align: 'center', render: v => v > 0 ? <Text strong>{v}</Text> : <Text type="secondary">-</Text> },
        { title: 'Tổng', dataIndex: 'total', key: 'total', align: 'center', render: v => <Text strong type="success">{v}</Text> },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[500px]">
                <Spin size="large" tip="Đang tải dữ liệu..." />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Breadcrumb
                items={[
                    { title: 'Trang chủ' },
                    { title: <span className="font-bold">Tổng quan</span> },
                ]}
            />

            {showBanner && user && (
                <Alert
                    message="Thành công!"
                    description={`Đăng nhập thành công! Chào mừng ${user.role === ROLES.ADMIN ? 'Quản trị viên' : (user.fullName || user.username)}`}
                    type="success"
                    showIcon
                    closable
                    onClose={() => setShowBanner(false)}
                    className="shadow-sm"
                />
            )}

            <div className="space-y-1">
                <Title level={2} style={{ margin: 0 }}>Tổng quan</Title>
                <Text type="secondary">Thống kê tổng quan hệ thống quản lý tài liệu bệnh viện.</Text>
            </div>

            {/* Stats Grid */}
            <Row gutter={[16, 16]}>
                {STATS.map((stat, idx) => (
                    <Col xs={24} sm={12} lg={6} key={idx}>
                        <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
                            <Statistic
                                title={<Text type="secondary">{stat.label}</Text>}
                                value={stat.value}
                                precision={0}
                                valueStyle={{ fontWeight: 'bold' }}
                                prefix={
                                    <div style={{ color: stat.color, backgroundColor: stat.bg }} className="p-2 rounded-lg mr-2 inline-flex items-center justify-center">
                                        {stat.icon}
                                    </div>
                                }
                                suffix={<div className="text-xs text-slate-400 mt-2 block font-normal">{stat.sub}</div>}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Doc Summary */}
            <Card bordered={false} className="shadow-sm">
                <Row justify="space-around" align="middle">
                    {DOC_TYPES.map((type, idx) => (
                        <Col key={idx} style={{ textAlign: 'center' }}>
                            <div className="flex flex-col items-center gap-2">
                                <div style={{ color: type.color, fontSize: '24px' }}>{type.icon}</div>
                                <Text type="secondary" style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>{type.name}</Text>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: type.color }}>{type.count}</div>
                            </div>
                        </Col>
                    ))}
                </Row>
            </Card>

            <Row gutter={[16, 16]}>
                {/* Table */}
                <Col xs={24} xl={14}>
                    <Card title="Thống kê theo Phòng ban" bordered={false} className="shadow-sm h-full">
                        <Table
                            columns={columns}
                            dataSource={TABLE_DATA}
                            pagination={false}
                            size="small"
                        />
                    </Card>
                </Col>

                {/* Charts */}
                <Col xs={24} xl={10}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        {/* Pie Chart */}
                        <Card title="Tỷ lệ Tài liệu" bordered={false} className="shadow-sm">
                            <div style={{ height: 250, width: '100%' }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={PIE_DATA}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {PIE_DATA.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Bar Chart */}
                        <Card title="Số lượng Tài liệu" bordered={false} className="shadow-sm">
                            <div style={{ height: 250, width: '100%' }}>
                                <ResponsiveContainer>
                                    <BarChart data={BAR_DATA}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" hide />
                                        <YAxis />
                                        <RechartsTooltip />
                                        <Bar dataKey="docs" fill="#1677ff" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </Space>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
