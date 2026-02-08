import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
    UserOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined,
    CalendarOutlined, SafetyCertificateOutlined, CameraOutlined,
    EditOutlined, SaveOutlined, BankOutlined
} from "@ant-design/icons";
import {
    Card, Avatar, Button, Tabs, Form, Input, Row, Col, Typography, Tag, Divider, Upload, message, Breadcrumb
} from "antd";

const { Title, Text, Paragraph } = Typography;

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState("info");

    const [avatar] = useState(user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`);

    const handleFinish = (values) => {
        updateUser({
            ...user,
            ...values,
            avatar
        });
        message.success("Cập nhật thông tin thành công!");
        setActiveTab("info");
    };

    const items = [
        {
            key: 'info',
            label: 'Thông tin cá nhân',
            children: (
                <div className="space-y-6 animate-fade-in">
                    <Row gutter={[24, 24]}>
                        <Col xs={24} md={12}>
                            <Title level={5}>Thông tin liên hệ</Title>
                            <div className="space-y-3 mt-4">
                                <InfoItem icon={<UserOutlined />} label="Họ và tên" value={user.name} />
                                <InfoItem icon={<MailOutlined />} label="Email" value={user.email} />
                                <InfoItem icon={<PhoneOutlined />} label="Số điện thoại" value={user.phone || "Chưa cập nhật"} />
                                <InfoItem icon={<EnvironmentOutlined />} label="Địa chỉ" value={user.address || "Chưa cập nhật"} />
                            </div>
                        </Col>
                        <Col xs={24} md={12}>
                            <Title level={5}>Công việc & Chức vụ</Title>
                            <div className="space-y-3 mt-4">
                                <InfoItem icon={<BankOutlined />} label="Phòng ban" value={user.department || "Khoa Nội"} />
                                <InfoItem icon={<SafetyCertificateOutlined />} label="Vai trò" value={<Tag color="blue">{user.role}</Tag>} />
                                <InfoItem icon={<CalendarOutlined />} label="Ngày tham gia" value="20/05/2023" />
                            </div>
                        </Col>
                    </Row>
                    <Divider />
                    <div>
                        <Title level={5}>Giới thiệu</Title>
                        <Paragraph type="secondary" className="mt-2">
                            {user.bio || "Chưa có thông tin giới thiệu."}
                        </Paragraph>
                    </div>
                </div>
            )
        },
        {
            key: 'edit',
            label: 'Chỉnh sửa hồ sơ',
            children: (
                <Form
                    layout="vertical"
                    form={form}
                    initialValues={{
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        address: user.address,
                        bio: user.bio,
                        dob: user.dob
                    }}
                    onFinish={handleFinish}
                    className="mt-4 animate-fade-in"
                >
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item label="Họ và tên" name="name" rules={[{ required: true }]}>
                                <Input prefix={<UserOutlined />} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
                                <Input prefix={<MailOutlined />} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item label="Số điện thoại" name="phone">
                                <Input prefix={<PhoneOutlined />} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item label="Địa chỉ" name="address">
                                <Input prefix={<EnvironmentOutlined />} />
                            </Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Form.Item label="Tiểu sử" name="bio">
                                <Input.TextArea rows={4} showCount maxLength={300} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                            Lưu thay đổi
                        </Button>
                    </Form.Item>
                </Form>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <Breadcrumb
                items={[
                    { title: 'Trang chủ' },
                    { title: <span className="font-bold">Hồ sơ cá nhân</span> },
                ]}
            />

            <Row gutter={[24, 24]}>
                {/* Left Col: Avatar Card */}
                <Col xs={24} lg={8}>
                    <Card bordered={false} className="shadow-sm text-center">
                        <div className="relative inline-block">
                            <Avatar size={120} src={avatar} className="mb-4 border-4 border-slate-50" />
                            <Upload
                                showUploadList={false}
                                beforeUpload={() => false}
                                onChange={(info) => {
                                    // Mock upload
                                    if (info.file) {
                                        // In real app, read file
                                        message.success("Đã thay đổi ảnh đại diện (Demo)");
                                    }
                                }}
                            >
                                <Button
                                    type="primary"
                                    shape="circle"
                                    icon={<CameraOutlined />}
                                    className="absolute bottom-4 right-0 shadow-md"
                                />
                            </Upload>
                        </div>
                        <Title level={3} style={{ marginBottom: 0 }}>{user.name}</Title>
                        <Text type="secondary">{user.email}</Text>

                        <div className="mt-6 flex justify-center gap-2">
                            <Tag color="geekblue">{user.department || "Nhân viên"}</Tag>
                            <Tag color="purple">{user.role}</Tag>
                        </div>
                    </Card>
                </Col>

                {/* Right Col: Details Tabs */}
                <Col xs={24} lg={16}>
                    <Card bordered={false} className="shadow-sm h-full">
                        <Tabs
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            items={items}
                            tabBarExtraContent={
                                activeTab === 'info' && (
                                    <Button type="text" icon={<EditOutlined />} onClick={() => setActiveTab('edit')}>
                                        Chỉnh sửa
                                    </Button>
                                )
                            }
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

const InfoItem = ({ icon, label, value }) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
        <Space className="text-slate-500">
            {icon}
            <span>{label}</span>
        </Space>
        <span className="font-medium text-slate-800">{value}</span>
    </div>
);

export default Profile;
