import { useState } from "react";
import {
    Table, Button, Input, Modal, Form, Select, Tag, Space, Tooltip, message, Card, Breadcrumb
} from "antd";
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    TeamOutlined, SearchOutlined, EnvironmentOutlined,
    BankOutlined, MedicineBoxOutlined, FileTextOutlined,
    InfoCircleOutlined, UserAddOutlined
} from "@ant-design/icons";

/**
 * Mock Data
 */
const MOCK_USERS = [
    { id: 1, name: "Trần Văn Trọng", email: "trong@gmail.com" },
    { id: 2, name: "Lê Gia Nam", email: "nam@gmail.com" },
    { id: 3, name: "Nguyễn Văn A", email: "a@gmail.com" },
    { id: 4, name: "Phạm Thị B", email: "b@gmail.com" },
];

const INITIAL_DEPTS = [
    {
        id: 1,
        name: "Khoa Nội",
        location: "Tầng 3",
        manager: { id: 1, name: "Trần Văn Trọng", email: "trong@gmail.com" },
        users_count: 12,
        docs_count: 5,
        updated_at: "25/01/2026",
        members: [1, 3]
    },
    {
        id: 2,
        name: "Phòng Tài Chính Kế Toán",
        location: "Tầng 5",
        manager: null,
        users_count: 4,
        docs_count: 120,
        updated_at: "24/01/2026",
        members: []
    },
    {
        id: 3,
        name: "Khoa Dược",
        location: "Tầng 1",
        manager: { id: 2, name: "Lê Gia Nam", email: "nam@gmail.com" },
        users_count: 8,
        docs_count: 45,
        updated_at: "20/01/2026",
        members: [2]
    },
];

const DepartmentManagement = () => {
    const [departments, setDepartments] = useState(INITIAL_DEPTS);
    const [searchText, setSearchText] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [form] = Form.useForm();

    const handleDelete = (id) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc chắn muốn xóa phòng ban này? Hành động này không thể hoàn tác.',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk() {
                setDepartments(prev => prev.filter(d => d.id !== id));
                message.success('Đã xóa phòng ban thành công');
            },
        });
    };

    const handleEdit = (record) => {
        setEditingDept(record);
        form.setFieldsValue({
            name: record.name,
            location: record.location,
            managerId: record.manager?.id,
            members: record.members
        });
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingDept(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleOk = () => {
        form.validateFields().then(values => {
            if (editingDept) {
                // Update logic
                setDepartments(prev => prev.map(d => {
                    if (d.id === editingDept.id) {
                        const manager = MOCK_USERS.find(u => u.id === values.managerId) || null;
                        return {
                            ...d,
                            ...values,
                            manager,
                            updated_at: "29/01/2026" // Mock update
                        };
                    }
                    return d;
                }));
                message.success('Cập nhật thành công');
            } else {
                // Create logic
                const newId = departments.length + 1;
                const manager = MOCK_USERS.find(u => u.id === values.managerId) || null;
                const newDept = {
                    id: newId,
                    name: values.name,
                    location: values.location,
                    manager,
                    users_count: 0,
                    docs_count: 0,
                    updated_at: "29/01/2026",
                    members: values.members || []
                };
                setDepartments([...departments, newDept]);
                message.success('Tạo phòng ban thành công');
            }
            setIsModalOpen(false);
        });
    };

    const columns = [
        {
            title: 'Tên Phòng Ban',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <BankOutlined />
                    </div>
                    <div>
                        <div className="font-medium text-slate-900">{text}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                            <EnvironmentOutlined /> {record.location || 'Chưa cập nhật'}
                        </div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Trưởng Phòng',
            dataIndex: 'manager',
            key: 'manager',
            render: (manager) => manager ? (
                <div>
                    <div className="font-medium text-slate-800">{manager.name}</div>
                    <div className="text-xs text-slate-500">{manager.email}</div>
                </div>
            ) : <span className="text-slate-400 italic text-xs">Chưa bổ nhiệm</span>,
        },
        {
            title: 'Nhân Sự',
            dataIndex: 'users_count',
            key: 'users_count',
            align: 'center',
            render: (count) => <Tag color="blue">{count} nhân viên</Tag>,
        },
        {
            title: 'Tài Liệu',
            dataIndex: 'docs_count',
            key: 'docs_count',
            align: 'center',
            render: (count) => <Tag color="cyan">{count} hồ sơ</Tag>,
        },
        {
            title: 'Cập Nhật',
            dataIndex: 'updated_at',
            key: 'updated_at',
            render: (date) => <span className="text-slate-500 text-sm">{date}</span>
        },
        {
            title: 'Hành Động',
            key: 'action',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Chỉnh sửa">
                        <Button type="text" icon={<EditOutlined className="text-blue-600" />} onClick={() => handleEdit(record)} />
                    </Tooltip>
                    <Tooltip title="Xem thành viên">
                        <Button type="text" icon={<TeamOutlined className="text-green-600" />} />
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const filteredData = departments.filter(d =>
        d.name.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div className="space-y-4">
            {/* Breadcrumb - Optional if Navbar handles it, but good for context */}
            <Breadcrumb
                items={[
                    { title: 'Trang chủ' },
                    { title: 'Quản trị hệ thống' },
                    { title: <span className="font-bold">Phòng ban</span> },
                ]}
            />

            <Card
                bordered={false}
                className="shadow-sm rounded-lg"
                title="Quản lý Phòng Ban"
                extra={
                    <Space>
                        <Input
                            prefix={<SearchOutlined className="text-slate-400" />}
                            placeholder="Tìm kiếm phòng ban..."
                            className="w-64"
                            onChange={e => setSearchText(e.target.value)}
                        />
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                            Tạo mới
                        </Button>
                    </Space>
                }
            >
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="id"
                    pagination={{ pageSize: 6 }}
                />
            </Card>

            {/* Create/Edit Modal */}
            <Modal
                title={editingDept ? "Chỉnh sửa Phòng ban" : "Tạo Phòng ban Mới"}
                open={isModalOpen}
                onOk={handleOk}
                onCancel={() => setIsModalOpen(false)}
                okText={editingDept ? "Cập nhật" : "Tạo mới"}
                cancelText="Hủy"
            >
                <Form
                    form={form}
                    layout="vertical"
                    className="mt-4"
                >
                    <Form.Item
                        name="name"
                        label="Tên phòng ban"
                        rules={[{ required: true, message: 'Vui lòng nhập tên phòng ban' }]}
                    >
                        <Input placeholder="Ví dụ: Khoa Nội Tiết" prefix={<BankOutlined />} />
                    </Form.Item>

                    <Form.Item
                        name="location"
                        label="Địa điểm / Tầng"
                    >
                        <Select placeholder="Chọn vị trí">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <Select.Option key={i} value={`Tầng ${i}`}>Tầng {i}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="managerId"
                            label="Trưởng phòng"
                            tooltip="Chỉ nhân viên thuộc phòng ban này mới được chọn làm trưởng phòng"
                        >
                            <Select placeholder="Chọn quản lý" allowClear>
                                {MOCK_USERS.map(u => (
                                    <Select.Option key={u.id} value={u.id}>{u.name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="members"
                            label="Thành viên ban đầu"
                        >
                            <Select mode="multiple" placeholder="Thêm nhân viên" maxTagCount="responsive">
                                {MOCK_USERS.map(u => (
                                    <Select.Option key={u.id} value={u.id}>{u.name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default DepartmentManagement;
