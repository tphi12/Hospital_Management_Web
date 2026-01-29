import { useState } from "react";
import {
    Table, Button, Input, Modal, Form, Select, Tag, Space, Tooltip, message, Card, Breadcrumb, Switch, Avatar
} from "antd";
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    SearchOutlined, UserOutlined,
    LockOutlined, UnlockOutlined,
    ManOutlined, CheckCircleOutlined, CloseCircleOutlined
} from "@ant-design/icons";
import { ROLES } from "../../lib/roles";

/**
 * Mock Data
 */
const INITIAL_USERS = [
    {
        id: 1,
        name: "Trần Văn Trọng",
        username: "trongtran",
        email: "trong14122003@gmail.com",
        avatar: "https://ui-avatars.com/api/?name=TV&background=random",
        dept: "Chưa có phòng ban",
        dept_id: "",
        position: "Nhân viên",
        roles: [],
        active: true,
        status: "ĐANG HOẠT ĐỘNG",
        phone: "0987654321"
    },
    {
        id: 2,
        name: "Trọng Trần",
        username: "trongtran_bs",
        email: "trong123@gmail.com",
        avatar: "https://ui-avatars.com/api/?name=TT&background=random",
        dept: "Khoa Sản",
        dept_id: "khoa-san",
        position: "Nhân viên",
        roles: ["BÁC SĨ"],
        active: false,
        status: "ĐÃ KHÓA",
        phone: "0123456789"
    },
    {
        id: 3,
        name: "Lê Gia Nam",
        username: "legianam",
        email: "lenamhtkhus@gmail.com",
        avatar: "https://ui-avatars.com/api/?name=LN&background=random",
        dept: "Khoa Hình ảnh",
        dept_id: "khoa-hinh-anh",
        position: "Nhân viên",
        roles: ["ADMIN"],
        active: true,
        status: "ĐANG HOẠT ĐỘNG",
        phone: "0999888777"
    },
];

const DEPARTMENTS = [
    { id: "khoa-noi", name: "Khoa Nội" },
    { id: "khoa-ngoai", name: "Khoa Ngoại" },
    { id: "khoa-san", name: "Khoa Sản" },
    { id: "khoa-hinh-anh", name: "Khoa Hình ảnh" },
    { id: "phong-ky-thuat", name: "Phòng Kỹ Thuật" },
];

const ROLE_OPTIONS = [
    { id: "ADMIN", name: "Admin" },
    { id: "BÁC SĨ", name: "Bác sĩ" },
    { id: "KẾ TOÁN", name: "Kế toán" },
    { id: "HOSPITAL_CLERK", name: "Văn thư" },
    { id: "HEAD_OF_DEPT", name: "Trưởng phòng" },
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
                    active: newStatus,
                    status: newStatus ? "ĐANG HOẠT ĐỘNG" : "ĐÃ KHÓA"
                };
            }
            return u;
        }));
        message.info(`Đã ${newStatus ? 'kích hoạt' : 'khóa'} tài khoản ${record.username}`);
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
                            status: values.active ? "ĐANG HOẠT ĐỘNG" : "ĐÃ KHÓA"
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
                    status: values.active ? "ĐANG HOẠT ĐỘNG" : "ĐÃ KHÓA",
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
                    <Avatar src={record.avatar} shape="square" size="large" />
                    <div>
                        <div className="font-medium text-slate-900">{text}</div>
                        <div className="text-xs text-slate-500">{record.email}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Phòng Ban / Chức Vụ',
            dataIndex: 'dept',
            key: 'dept',
            render: (text, record) => (
                <div>
                    <div className="font-medium text-slate-700">{text}</div>
                    <div className="text-xs text-slate-500">{record.position}</div>
                </div>
            ),
        },
        {
            title: 'Vai Trò',
            dataIndex: 'roles',
            key: 'roles',
            render: (roles) => (
                <Space wrap>
                    {roles.length > 0 ? roles.map((role, idx) => (
                        <Tag key={idx} color="blue">{role}</Tag>
                    )) : <Tag color="default">Mặc định</Tag>}
                </Space>
            ),
        },
        {
            title: 'Trạng Thái',
            dataIndex: 'active',
            key: 'active',
            align: 'center',
            render: (active) => (
                <Tag icon={active ? <CheckCircleOutlined /> : <CloseCircleOutlined />} color={active ? "success" : "error"}>
                    {active ? "Hoạt động" : "Đã khóa"}
                </Tag>
            ),
        },
        {
            title: 'Hành Động',
            key: 'action',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Chỉnh sửa">
                        <Button type="text" icon={<EditOutlined className="text-blue-600" />} onClick={() => handleEdit(record)} />
                    </Tooltip>
                    <Tooltip title={record.active ? "Khóa tài khoản" : "Mở khóa"}>
                        <Button
                            type="text"
                            icon={record.active ? <LockOutlined className="text-orange-500" /> : <UnlockOutlined className="text-green-500" />}
                            onClick={() => handleToggleStatus(record)}
                        />
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
                    { title: 'Quản trị hệ thống' },
                    { title: <span className="font-bold">Người dùng</span> },
                ]}
            />

            <Card
                bordered={false}
                className="shadow-sm rounded-lg"
                title="Quản lý Người Dùng"
                extra={
                    <Space>
                        <Input
                            prefix={<SearchOutlined className="text-slate-400" />}
                            placeholder="Tìm kiếm người dùng..."
                            className="w-64"
                            onChange={handleSearch}
                        />
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                            Tạo tài khoản
                        </Button>
                    </Space>
                }
            >
                <Table
                    columns={columns}
                    dataSource={filteredUsers}
                    rowKey="id"
                    pagination={{ pageSize: 6 }}
                />
            </Card>

            <Modal
                title={editingUser ? "Chỉnh sửa Người dùng" : "Tạo Người dùng Mới"}
                open={isModalOpen}
                onOk={handleOk}
                onCancel={() => setIsModalOpen(false)}
                okText={editingUser ? "Cập nhật" : "Tạo mới"}
                cancelText="Hủy"
                width={700}
            >
                <Form
                    form={form}
                    layout="vertical"
                    className="mt-4"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="name"
                            label="Họ và tên"
                            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="Nhập họ tên" />
                        </Form.Item>
                        <Form.Item
                            name="username"
                            label="Tên đăng nhập"
                            rules={[{ required: true, message: 'Vui lòng nhập username' }]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="username" disabled={!!editingUser} />
                        </Form.Item>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="email"
                            label="Email"
                            rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}
                        >
                            <Input placeholder="example@gmail.com" />
                        </Form.Item>
                        <Form.Item
                            name="phone"
                            label="Số điện thoại"
                        >
                            <Input placeholder="09xxxx..." />
                        </Form.Item>
                    </div>

                    {!editingUser && (
                        <div className="grid grid-cols-2 gap-4">
                            <Form.Item
                                name="password"
                                label="Mật khẩu"
                                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
                            >
                                <Input.Password />
                            </Form.Item>
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
                                <Input.Password />
                            </Form.Item>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="dept_id" label="Phòng ban">
                            <Select placeholder="Chọn phòng ban" allowClear>
                                {DEPARTMENTS.map(d => (
                                    <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item name="roles" label="Vai trò hệ thống">
                            <Select mode="multiple" placeholder="Chọn vai trò" maxTagCount="responsive">
                                {ROLE_OPTIONS.map(r => (
                                    <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item name="active" valuePropName="checked" label="Trạng thái">
                        <Switch checkedChildren="Hoạt động" unCheckedChildren="Đã khóa" />
                    </Form.Item>

                </Form>
            </Modal>
        </div>
    );
};

export default UserManagement;
