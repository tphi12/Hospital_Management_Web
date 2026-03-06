import { useState, useEffect } from "react";
import {
    Table,
    Button,
    Input,
    Modal,
    Form,
    Select,
    Tag,
    Space,
    Tooltip,
    message,
    Card,
    Breadcrumb,
    Switch,
    Avatar,
    Typography,
    Row,
    Col,
    Spin
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    UserOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined
} from "@ant-design/icons";
import { ROLES, ROLE_DETAILS } from "../../lib/roles";
import { userService, departmentService, roleService } from "../../services";

const { Title, Text } = Typography;

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [form] = Form.useForm();

    // Fetch initial data
    useEffect(() => {
        fetchUsers();
        fetchDepartments();
        fetchRoles();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await userService.getAllUsers();
            const data = response.data || response;
            const mapped = Array.isArray(data)
                ? data.map(u => ({
                    ...u,
                    id: u.id || u.user_id, // đảm bảo có id cho rowKey & api calls
                    name: u.name || u.full_name || u.username || u.email,
                    full_name: u.full_name || u.name,
                    department_id: u.department_id,
                    department: u.department || {
                        name: u.department_name || 'Chưa có',
                        code: u.department_code,
                    },
                    role: u.role || (u.role_name || u.role_code || u.roles
                        ? { name: u.role_name || u.role_code || u.roles }
                        : null),
                    role_id: parseInt(u.role_ids || u.role_id, 10) || null,
                }))
                : [];
            setUsers(mapped);
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể tải danh sách người dùng");
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await departmentService.getAllDepartments();
            const data = response.data || response;
            const mapped = Array.isArray(data)
                ? data.map((d, idx) => ({
                    ...d,
                    id: d.id || d.department_id || `dept-${idx}`,
                    name: d.name || d.department_name || 'Chưa cập nhật',
                }))
                : [];
            setDepartments(mapped);
        } catch (error) {
            console.error("Failed to fetch departments:", error);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await roleService.getAllRoles();
            const data = response.data || response;
            const mapped = Array.isArray(data)
                ? data.map((r, idx) => ({
                    ...r,
                    id: r.id || r.role_id || `role-${idx}`,
                    name: r.name || r.role_name || r.role_code || 'Vai trò',
                }))
                : [];
            setRoles(mapped);
        } catch (error) {
            console.error("Failed to fetch roles:", error);
        }
    };

    const handleSearch = (e) => setSearchText(e.target.value.toLowerCase());

    const filteredUsers = users.filter(user => {
        const name = (user?.name || '').toLowerCase();
        const email = (user?.email || '').toLowerCase();
        return name.includes(searchText) || email.includes(searchText);
    });

    const handleDelete = async (id) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc muốn xóa người dùng này?',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            async onOk() {
                try {
                    await userService.deleteUser(id);
                    message.success('Đã xóa người dùng thành công');
                    fetchUsers();
                } catch (error) {
                    message.error(error.response?.data?.message || 'Không thể xóa người dùng');
                }
            },
        });
    };

    const handleToggleStatus = async (record) => {
        const newStatus = record.status === 'active' ? 'inactive' : 'active';
        const userId = record.id || record.user_id;
        if (!userId) {
            message.error('Không tìm thấy ID người dùng');
            return;
        }
        try {
            await userService.updateUserStatus(userId, newStatus);
            message.success(`${newStatus === 'active' ? 'Kích hoạt' : 'Khóa'} tài khoản thành công`);
            fetchUsers();
        } catch (error) {
            message.error(error.response?.data?.message || 'Không thể cập nhật trạng thái');
        }
    };

    const handleEdit = (record) => {
        setEditingUser(record);
        form.setFieldsValue({
            name: record.full_name || record.name,
            email: record.email,
            phone: record.phone,
            department_id: record.department_id,
            role_id: record.role_id || record.role?.id || record.role?.role_id,
        });
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingUser(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();

            // Map form values to backend payload
            const payload = {
                full_name: values.name,
                username: (values.username
                    || editingUser?.username
                    || (values.email ? values.email.split('@')[0] : values.name)?.toLowerCase().replace(/\s+/g, '.'))?.trim(),
                email: values.email,
                phone: values.phone,
                department_id: values.department_id,
                new_password: values.confirmPassword || null,
                role_id: values.role_id,
                scope_type: 'department',
                employee_code: values.employee_code || null,
                gender: values.gender || null,
                date_of_birth: values.date_of_birth || null,
            };

            // console.log(payload);

            if (!editingUser) {
                payload.password = values.password;
            }

            if (editingUser) {
                await userService.updateUser(editingUser.id, payload);
                if (values.role_id) {
                    await userService.assignRole(editingUser.id, values.role_id, 'department', values.department_id);
                }
                message.success('Cập nhật người dùng thành công');
            } else {
                await userService.createUser(payload);
                message.success('Tạo người dùng mới thành công');
            }

            setIsModalOpen(false);
            fetchUsers();
        } catch (error) {
            if (error.response) {
                message.error(error.response?.data?.message || 'Có lỗi xảy ra');
            }
        }
    };

    const columns = [
        {
            title: 'Người Dùng',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <Avatar
                        src={record.avatar}
                        shape="square"
                        size="large"
                        icon={<UserOutlined />}
                        style={{ backgroundColor: '#1890ff' }}
                    >
                        {!record.avatar && text?.charAt(0)}
                    </Avatar>
                    <div>
                        <Text strong className="block">{text}</Text>
                        <Text type="secondary" className="text-xs">{record.email}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Phòng Ban',
            dataIndex: 'department',
            key: 'department',
            render: (dept, record) => (
                <div>
                    <Text className="block">{dept?.name || 'Chưa có'}</Text>
                    <Text type="secondary" className="text-xs">{record.position || ''}</Text>
                </div>
            ),
        },
        {
            title: 'Vai Trò',
            dataIndex: 'role',
            key: 'role',
            render: (role) => (
                role ? (
                    <Tag color="blue">{role.name}</Tag>
                ) : (
                    <Tag>Chưa có</Tag>
                )
            ),
        },
        {
            title: 'Trạng Thái',
            dataIndex: 'status',
            key: 'status',
            align: 'center',
            render: (status, record) => (
                <Switch
                    checked={status === 'active'}
                    onChange={() => handleToggleStatus(record)}
                    checkedChildren="Hoạt động"
                    unCheckedChildren="Khóa"
                />
            ),
        },
        {
            title: 'Hành Động',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Chỉnh sửa">
                        <Button type="text" icon={<EditOutlined className="text-blue-500" />} onClick={() => handleEdit(record)} />
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <Breadcrumb
                items={[
                    { title: 'Trang chủ' },
                    { title: <span className="font-bold">Quản lý người dùng</span> },
                ]}
            />

            <div className="flex justify-between items-center">
                <div>
                    <Title level={2} style={{ margin: 0 }}>
                        <UserOutlined className="mr-2 text-blue-600" />
                        Danh sách người dùng
                    </Title>
                    <Text type="secondary">Quản lý tài khoản, phân quyền và thông tin nhân sự.</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} size="large">
                    Thêm người dùng
                </Button>
            </div>

            <Card variant="borderless" className="shadow-sm">
                <div className="mb-4 flex justify-between">
                    <Input
                        prefix={<SearchOutlined className="text-slate-400" />}
                        placeholder="Tìm kiếm theo tên, email..."
                        className="w-full max-w-md"
                        value={searchText}
                        onChange={handleSearch}
                        allowClear
                        size="large"
                    />
                </div>
                <Spin spinning={loading}>
                    <Table
                        columns={columns}
                        dataSource={filteredUsers}
                        // Ensure stable unique keys even if backend misses id field
                        rowKey={(record) => record.id || record.user_id || record.email}
                        pagination={{ pageSize: 8, placement: 'bottomRight' }}
                    />
                </Spin>
            </Card>

            <Modal
                title={
                    <div className="flex items-center gap-2 text-lg">
                        {editingUser ? <EditOutlined className="text-blue-500" /> : <PlusOutlined className="text-blue-500" />}
                        <span>{editingUser ? "Chỉnh sửa tài khoản" : "Tạo tài khoản mới"}</span>
                    </div>
                }
                open={isModalOpen}
                onOk={handleOk}
                onCancel={() => setIsModalOpen(false)}
                okText={editingUser ? "Lưu thay đổi" : "Tạo mới"}
                cancelText="Hủy"
                width={700}
                centered
                maskClosable={false}
            >
                <Form
                    form={form}
                    layout="vertical"
                    className="mt-4"
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="name"
                                label="Họ và tên"
                                rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                            >
                                <Input prefix={<UserOutlined />} placeholder="Ví dụ: Nguyễn Văn A" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}
                            >
                                <Input placeholder="example@gmail.com" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="phone"
                                label="Số điện thoại"
                                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                            >
                                <Input placeholder="09xxxx..." />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="department_id"
                                label="Phòng ban"
                                rules={[{ required: true, message: 'Vui lòng chọn phòng ban' }]}
                            >
                                <Select placeholder="Chọn phòng ban" allowClear>
                                    {departments.map(d => (
                                        <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    {editingUser && (
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="password"
                                    label="Mật khẩu"
                                    dependencies={['confirmPassword']}
                                    rules={[
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (getFieldValue('confirmPassword') && !value) {
                                                    return Promise.reject(new Error('Vui lòng nhập mật khẩu!'));
                                                }
                                                return Promise.resolve();
                                            },
                                        }),
                                    ]}
                                >
                                    <Input.Password placeholder="******" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="confirmPassword"
                                    label="Xác nhận mật khẩu"
                                    dependencies={['password']}
                                    rules={[
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                const password = getFieldValue('password');
                                                if (password && !value) {
                                                    return Promise.reject(new Error('Vui lòng xác nhận mật khẩu!'));
                                                }
                                                if (password && value !== password) {
                                                    return Promise.reject(new Error('Mật khẩu không khớp!'));
                                                }
                                                return Promise.resolve();
                                            },
                                        }),
                                    ]}
                                >
                                    <Input.Password placeholder="******" />
                                </Form.Item>
                            </Col>
                        </Row>
                    )}

                    <Form.Item
                        name="role_id"
                        label="Vai trò hệ thống"
                        rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
                    >
                        <Select placeholder="Chọn vai trò">
                            {roles.map(role => (
                                <Select.Option key={role.id} value={role.id}>{role.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                </Form>
            </Modal>
        </div>
    );
};

export default UserManagement;

