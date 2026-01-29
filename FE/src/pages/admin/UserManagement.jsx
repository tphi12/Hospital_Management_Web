import { useState } from "react";
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
    Col
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

const { Title, Text } = Typography;

/**
 * Mock Data
 */
const INITIAL_USERS = [
    {
        id: 1,
        name: "Nguyễn Văn Admin",
        username: "admin",
        email: "admin@hospital.com",
        phone: "0901234567",
        dept_id: 1,
        dept: "Ban Giám Đốc",
        position: "Quản trị viên",
        roles: [ROLES.ADMIN],
        active: true,
        avatar: "https://ui-avatars.com/api/?name=Nguyen+Van+Admin&background=random",
    },
    {
        id: 2,
        name: "Trần Thị Bác Sĩ",
        username: "user1",
        email: "bs.tran@hospital.com",
        phone: "0912345678",
        dept_id: 2,
        dept: "Khoa Nội",
        position: "Trưởng khoa",
        roles: [ROLES.HEAD_OF_DEPT],
        active: true,
        avatar: "https://ui-avatars.com/api/?name=Tran+Thi+Bac+Si&background=random",
    },
    {
        id: 3,
        name: "Lê Văn Kế Toán",
        username: "ketoan",
        email: "ketoan@hospital.com",
        phone: "0987654321",
        dept_id: 3,
        dept: "Phòng Tài Chính",
        position: "Nhân viên Kế toán",
        roles: [ROLES.STAFF],
        active: false,
        avatar: "https://ui-avatars.com/api/?name=Le+Van+Ke+Toan&background=random",
    },
    {
        id: 4,
        name: "Phạm Điều Dưỡng",
        username: "nurse1",
        email: "dieuduong@hospital.com",
        phone: "0933333333",
        dept_id: 2,
        dept: "Khoa Nội",
        position: "Thư ký khoa",
        roles: [ROLES.DEPT_CLERK],
        active: true,
        avatar: "https://ui-avatars.com/api/?name=Pham+Dieu+Duong&background=random",
    },
];

const DEPARTMENTS = [
    { id: 1, name: "Ban Giám Đốc" },
    { id: 2, name: "Khoa Nội" },
    { id: 3, name: "Phòng Tài Chính" },
    { id: 4, name: "Khoa Ngoại" },
    { id: 5, name: "Phòng Hành Chính" },
    { id: 6, name: "Khoa Sản" },
    { id: 7, name: "Khoa Hình ảnh" },
];

const UserManagement = () => {
    const [users, setUsers] = useState(INITIAL_USERS);
    const [searchText, setSearchText] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [form] = Form.useForm();

    const handleSearch = (e) => setSearchText(e.target.value.toLowerCase());

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchText) ||
        user.email.toLowerCase().includes(searchText)
    );

    const handleDelete = (id) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc muốn xóa mềm tài khoản này? Nó sẽ bị ẩn khỏi danh sách.',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk() {
                setUsers(prev => prev.filter(u => u.id !== id));
                message.success('Đã xóa người dùng thành công');
            },
        });
    };

    const handleToggleStatus = (record) => {
        const newStatus = !record.active;
        setUsers(users.map(u => {
            if (u.id === record.id) {
                return {
                    ...u,
                    active: newStatus
                };
            }
            return u;
        }));
        message.success(`${newStatus ? 'Kích hoạt' : 'Khóa'} tài khoản ${record.username} thành công`);
    };

    const handleEdit = (record) => {
        setEditingUser(record);
        form.setFieldsValue({
            name: record.name,
            username: record.username,
            email: record.email,
            phone: record.phone,
            dept_id: record.dept_id,
            roles: record.roles,
            active: record.active
        });
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingUser(null);
        form.resetFields();
        form.setFieldsValue({ active: true });
        setIsModalOpen(true);
    };

    const handleOk = () => {
        form.validateFields().then(values => {
            const deptName = DEPARTMENTS.find(d => d.id === values.dept_id)?.name || "Chưa có phòng ban";

            if (editingUser) {
                setUsers(prev => prev.map(u => {
                    if (u.id === editingUser.id) {
                        return {
                            ...u,
                            ...values,
                            dept: deptName,
                        };
                    }
                    return u;
                }));
                message.success('Cập nhật người dùng thành công');
            } else {
                const newUser = {
                    id: users.length + 1,
                    ...values,
                    avatar: `https://ui-avatars.com/api/?name=${values.name}&background=random`,
                    dept: deptName,
                    position: "Nhân viên",
                    roles: values.roles || []
                };
                setUsers([...users, newUser]);
                message.success('Tạo người dùng mới thành công');
            }
            setIsModalOpen(false);
        });
    };

    const columns = [
        {
            title: 'Người Dùng',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <Avatar src={record.avatar} shape="square" size="large" icon={<UserOutlined />} />
                    <div>
                        <Text strong className="block">{text}</Text>
                        <Text type="secondary" className="text-xs">{record.email}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Phòng Ban',
            dataIndex: 'dept',
            key: 'dept',
            render: (text, record) => (
                <div>
                    <Text className="block">{text}</Text>
                    <Text type="secondary" className="text-xs">{record.position}</Text>
                </div>
            ),
        },
        {
            title: 'Vai Trò',
            dataIndex: 'roles',
            key: 'roles',
            render: (roles) => (
                <Space wrap>
                    {roles.map((role, idx) => {
                        const roleInfo = ROLE_DETAILS[role];
                        return (
                            <Tag key={idx} color={roleInfo ? "blue" : "default"}>
                                {roleInfo ? roleInfo.label : role}
                            </Tag>
                        );
                    })}
                </Space>
            ),
        },
        {
            title: 'Trạng Thái',
            dataIndex: 'active',
            key: 'active',
            align: 'center',
            render: (active, record) => (
                <Switch
                    checked={active}
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

            <Card bordered={false} className="shadow-sm">
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
                <Table
                    columns={columns}
                    dataSource={filteredUsers}
                    rowKey="id"
                    pagination={{ pageSize: 8, position: ['bottomRight'] }}
                />
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
                                name="username"
                                label="Tên đăng nhập"
                                rules={[{ required: true, message: 'Vui lòng nhập username' }]}
                            >
                                <Input prefix={<UserOutlined />} placeholder="username" disabled={!!editingUser} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}
                            >
                                <Input placeholder="example@gmail.com" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="phone"
                                label="Số điện thoại"
                            >
                                <Input placeholder="09xxxx..." />
                            </Form.Item>
                        </Col>
                    </Row>

                    {!editingUser && (
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="password"
                                    label="Mật khẩu"
                                    rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
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
                                        { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue('password') === value) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject(new Error('Mật khẩu không khớp!'));
                                            },
                                        }),
                                    ]}
                                >
                                    <Input.Password placeholder="******" />
                                </Form.Item>
                            </Col>
                        </Row>
                    )}

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="dept_id" label="Phòng ban">
                                <Select placeholder="Chọn phòng ban" allowClear>
                                    {DEPARTMENTS.map(d => (
                                        <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="roles" label="Vai trò hệ thống">
                                <Select mode="multiple" placeholder="Chọn vai trò" maxTagCount="responsive">
                                    {Object.values(ROLES).map(role => (
                                        <Select.Option key={role} value={role}>{ROLE_DETAILS[role]?.label || role}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="active" valuePropName="checked" label="Trạng thái tài khoản">
                        <Switch checkedChildren="Đang hoạt động" unCheckedChildren="Đã khóa" />
                    </Form.Item>

                </Form>
            </Modal>
        </div>
    );
};

export default UserManagement;
