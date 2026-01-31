import { useState } from "react";
import {
    SafetyCertificateOutlined,
    InfoCircleOutlined,
    CheckOutlined,
    CloseOutlined,
    PlusOutlined,
    SaveOutlined,
    UserOutlined,
    LockOutlined,
    RightOutlined,
    SearchOutlined
} from "@ant-design/icons";
import {
    Layout,
    Menu,
    Typography,
    Button,
    Card,
    Input,
    Switch,
    Tag,
    List,
    Avatar,
    Breadcrumb,
    Modal,
    Form,
    message,
    Tooltip,
    Alert,
    Row,
    Col
} from "antd";
import { ROLES, ROLE_DETAILS, PERMISSIONS } from "../../lib/roles";

const { Header, Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

const RoleManagement = () => {
    // State
    const [selectedRole, setSelectedRole] = useState(ROLES.ADMIN);
    const [isEditing, setIsEditing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [form] = Form.useForm();

    // Convert PERMISSIONS object to array for easier mapping
    const permissionList = Object.values(PERMISSIONS);
    const roleList = Object.keys(ROLES);

    // Mock user counts per role
    const ROLE_COUNTS = {
        [ROLES.ADMIN]: 2,
        [ROLES.HOSPITAL_CLERK]: 5,
        [ROLES.HEAD_OF_DEPT]: 12,
        [ROLES.DEPT_CLERK]: 8,
        [ROLES.STAFF]: 45,
        [ROLES.KHTH]: 3,
    };

    // Helper to check if role has permission
    const hasPermission = (permissionKey, roleKey) => {
        return PERMISSIONS[permissionKey]?.roles.includes(roleKey);
    };

    const handleRoleSelect = (key) => {
        setSelectedRole(key);
        setIsEditing(false);
    };

    const handleSave = () => {
        setIsEditing(false);
        message.success("Đã lưu thay đổi phân quyền (Demo)");
    };

    const handleCreateRole = (values) => {
        console.log("Creating role:", values);
        message.success("Tạo vai trò mới thành công (Demo)"); // Mock success
        setShowCreateModal(false);
        form.resetFields();
    };

    const currentRoleDetails = ROLE_DETAILS[selectedRole] || { label: selectedRole, description: "" };

    const filteredPermissions = permissionList.filter(p =>
        p.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col space-y-4">
            <Breadcrumb
                items={[
                    { title: 'Trang chủ' },
                    { title: 'Admin' },
                    { title: <span className="font-bold">Quản lý Phân quyền</span> },
                ]}
            />

            <div className="flex justify-between items-center">
                <div>
                    <Title level={2} style={{ margin: 0 }}>
                        <SafetyCertificateOutlined className="text-blue-600 mr-2" />
                        Quản lý Phân quyền
                    </Title>
                    <Text type="secondary">Cấu hình quyền hạn truy cập cho từng vai trò trong hệ thống.</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreateModal(true)}>
                    Thêm vai trò mới
                </Button>
            </div>

            <Layout className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm flex-1">
                <Sider width={280} theme="light" className="border-r border-slate-200">
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <Text strong type="secondary" style={{ fontSize: '12px' }}>DANH SÁCH VAI TRÒ</Text>
                    </div>
                    <Menu
                        mode="inline"
                        selectedKeys={[selectedRole]}
                        onClick={({ key }) => handleRoleSelect(key)}
                        style={{ borderRight: 0 }}
                        items={roleList.map(role => ({
                            key: role,
                            label: (
                                <div className="flex justify-between items-center w-full">
                                    <span>{ROLE_DETAILS[role]?.label || role}</span>
                                    <Tag color="default" bordered={false} className="mr-0 rounded-full text-[10px]">
                                        {ROLE_COUNTS[role] || 0}
                                    </Tag>
                                </div>
                            ),
                            icon: <UserOutlined />
                        }))}
                    />
                    <div className="p-4 m-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex gap-2">
                            <InfoCircleOutlined className="text-blue-600 mt-1" />
                            <div>
                                <Text strong className="text-blue-800 text-xs">Lưu ý quan trọng</Text>
                                <Paragraph className="text-blue-700 text-xs mb-0 mt-1">
                                    Thay đổi quyền hạn sẽ cập nhật ngay lập tức cho tất cả users thuộc vai trò này.
                                </Paragraph>
                            </div>
                        </div>
                    </div>
                </Sider>

                <Content className="p-6 overflow-y-auto bg-slate-50/30">
                    <Card
                        bordered={false}
                        className="shadow-sm mb-0"
                        title={
                            <div className="flex items-center gap-3">
                                <Avatar shape="square" size="large" icon={<SafetyCertificateOutlined />} className="bg-blue-100 text-blue-600" />
                                <div>
                                    <Title level={4} style={{ margin: 0 }}>{currentRoleDetails.label}</Title>
                                    <Text type="secondary" className="text-xs font-normal">{currentRoleDetails.description}</Text>
                                </div>
                            </div>
                        }
                        extra={
                            <div className="flex gap-2">
                                {!isEditing ? (
                                    <Button onClick={() => setIsEditing(true)}>Chỉnh sửa quyền</Button>
                                ) : (
                                    <>
                                        <Button onClick={() => setIsEditing(false)}>Hủy</Button>
                                        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>Lưu thay đổi</Button>
                                    </>
                                )}
                            </div>
                        }
                    >
                        <div className="flex justify-between items-center mb-4">
                            <Text strong>
                                <LockOutlined className="mr-2" />
                                Bảng phân quyền chi tiết
                            </Text>
                            <Search
                                placeholder="Tìm quyền hạn..."
                                allowClear
                                onSearch={setSearchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: 250 }}
                            />
                        </div>

                        <List
                            itemLayout="horizontal"
                            dataSource={filteredPermissions}
                            renderItem={(item) => {
                                const hasAccess = hasPermission(item.id, selectedRole);
                                return (
                                    <List.Item
                                        actions={[
                                            isEditing ? (
                                                <Switch checked={hasAccess} />
                                            ) : (
                                                hasAccess ? (
                                                    <Tag color="success" icon={<CheckOutlined />}>Được phép</Tag>
                                                ) : (
                                                    <Tag color="default" icon={<CloseOutlined />}>Không</Tag>
                                                )
                                            )
                                        ]}
                                        className="hover:bg-slate-50 transition-colors px-4 rounded-lg"
                                    >
                                        <List.Item.Meta
                                            title={<Text strong>{item.label}</Text>}
                                            description={<Text type="secondary" code>{item.id}</Text>}
                                        />
                                    </List.Item>
                                );
                            }}
                        />
                    </Card>
                </Content>
            </Layout>

            {/* Create Role Modal */}
            <Modal
                title="Tạo vai trò mới"
                open={showCreateModal}
                onCancel={() => setShowCreateModal(false)}
                footer={null}
            >
                <Alert message="Sau khi tạo, bạn có thể cấu hình chi tiết quyền hạn ở màn hình chính." type="info" showIcon className="mb-4" />
                <Form form={form} layout="vertical" onFinish={handleCreateRole}>
                    <Form.Item label="Tên vai trò" name="label" rules={[{ required: true, message: 'Vui lòng nhập tên vai trò' }]}>
                        <Input placeholder="VD: Điều dưỡng trưởng" />
                    </Form.Item>
                    <Form.Item label="Mã vai trò (System ID)" name="key" rules={[{ required: true, message: 'Vui lòng nhập mã vai trò' }]}>
                        <Input placeholder="VD: NURSE_MANAGER" style={{ fontFamily: 'monospace' }} />
                    </Form.Item>
                    <Form.Item label="Mô tả" name="description">
                        <Input.TextArea rows={3} placeholder="Mô tả vai trò này..." />
                    </Form.Item>
                    <div className="flex justify-end gap-2">
                        <Button onClick={() => setShowCreateModal(false)}>Hủy</Button>
                        <Button type="primary" htmlType="submit">Tạo vai trò</Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default RoleManagement;