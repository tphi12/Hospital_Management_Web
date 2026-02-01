import { useAuth } from "../hooks/useAuth";
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
import { useState } from "react";
import { Card, Row, Col, Statistic, Table, Alert, Typography, Breadcrumb, Space } from "antd";

const { Title, Text } = Typography;

const Dashboard = () => {
    const { user } = useAuth();
    const [showBanner, setShowBanner] = useState(true);

    // Mock Data
    const STATS = [
        { label: "Người Dùng", value: 16, sub: "+0 mới", icon: <UserOutlined />, color: "#0891b2", bg: "#ecfeff" }, // primary
        { label: "Phòng Ban", value: 11, sub: "100% hoạt động", icon: <BankOutlined />, color: "#10b981", bg: "#ecfdf5" }, // emerald
        { label: "Tài Liệu", value: 12, sub: "+0 mới", icon: <FileTextOutlined />, color: "#f59e0b", bg: "#fffbeb" }, // amber
        { label: "Lịch Trực", value: 0, sub: "0/0 đã gửi", icon: <CalendarOutlined />, color: "#f43f5e", bg: "#fff1f2" }, // rose
    ];

    const TABLE_DATA = [
        { key: 1, name: "Phòng Kỹ Thuật", word: 0, excel: 1, pdf: 5, image: 0, total: 6 },
        { key: 2, name: "Khoa Nội", word: 1, excel: 0, pdf: 0, image: 0, total: 2 },
        { key: 3, name: "Khoa Ngoại", word: 0, excel: 0, pdf: 1, image: 0, total: 1 },
        { key: 4, name: "Khoa Sản", word: 0, excel: 0, pdf: 1, image: 0, total: 1 },
        { key: 5, name: "Khoa Nhi", word: 0, excel: 0, pdf: 0, image: 0, total: 0 },
        { key: 6, name: "Khoa Tim mạch", word: 0, excel: 0, pdf: 0, image: 0, total: 0 },
        { key: 7, name: "Khoa Răng Hàm Mặt", word: 0, excel: 0, pdf: 0, image: 0, total: 0 },
    ];

    const DOC_TYPES = [
        { name: 'WORD', count: 1, color: "#3b82f6", icon: <FileWordOutlined /> }, // blue
        { name: 'EXCEL', count: 1, color: "#10b981", icon: <FileExcelOutlined /> }, // emerald
        { name: 'PDF', count: 8, color: "#f43f5e", icon: <FilePdfOutlined /> }, // rose
        { name: 'IMAGE', count: 0, color: "#f59e0b", icon: <FileImageOutlined /> }, // amber
    ];

    const PIE_DATA = [
        { name: 'Word', value: 1, color: '#3b82f6' },
        { name: 'Excel', value: 1, color: '#10b981' },
        { name: 'PDF', value: 8, color: '#f43f5e' },
        { name: 'Image', value: 0, color: '#f59e0b' },
    ];

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

    return (
        <div className="space-y-6">
            <Breadcrumb
                items={[
                    { title: 'Trang chủ' },
                    { title: <span className="font-bold">Tổng quan</span> },
                ]}
            />

            {showBanner && (
                <Alert
                    message="Thành công!"
                    description={`Đăng nhập thành công! Chào mừng ${user.role === 'ADMIN' ? 'Quản trị viên' : user.name}`}
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
                                        <Bar dataKey="docs" fill="#0891b2" radius={[4, 4, 0, 0]} />
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
