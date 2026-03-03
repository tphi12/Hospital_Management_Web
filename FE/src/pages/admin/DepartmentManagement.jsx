import { useState, useEffect } from "react";
import {
    Table, Button, Input, Modal, Form, Select, Tag, Space, Tooltip, message, Card, Breadcrumb, Spin
} from "antd";
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    TeamOutlined, SearchOutlined, EnvironmentOutlined,
    BankOutlined, MedicineBoxOutlined, FileTextOutlined,
    InfoCircleOutlined, UserAddOutlined
} from "@ant-design/icons";
import { departmentService, userService } from "../../services";

const DepartmentManagement = () => {
    const [departments, setDepartments] = useState([]);
    const [_users, _setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [form] = Form.useForm();

    // States for viewing members
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
    const [departmentMembers, setDepartmentMembers] = useState([]);
    const [selectedDepartmentName, setSelectedDepartmentName] = useState("");
    const [membersLoading, setMembersLoading] = useState(false);

    useEffect(() => {
        fetchDepartments();
        fetchUsers();
    }, []);

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const response = await departmentService.getAllDepartments();
            const data = response.data || response;
            const mapped = Array.isArray(data)
                ? data.map((d, idx) => ({
                    ...d,
                    id: d.id || d.department_id || `dept-${idx}`,
                    name: d.name || d.department_name || 'Chưa cập nhật',
                    department_code: d.department_code,
                    department_type: d.department_type,
                    // Map backend manager_name to head for display
                    head: d.head || (d.manager_name ? { name: d.manager_name, email: d.manager_email } : null),
                    // Map description fallbacks
                    description: d.description || d.department_description || '',
                    // updated_at already exists; keep as-is
                }))
                : [];
            setDepartments(mapped);
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể tải danh sách phòng ban");
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await userService.getAllUsers();
            const data = response.data || response;
            const mapped = Array.isArray(data)
                ? data.map((u, idx) => ({
                    ...u,
                    id: u.id || u.user_id || `user-${idx}`,
                    name: u.name || u.full_name || u.username || 'Người dùng',
                    email: u.email,
                }))
                : [];
            _setUsers(mapped);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
    };

    const handleDelete = async (id) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc chắn muốn xóa phòng ban này? Hành động này không thể hoàn tác.',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            async onOk() {
                try {
                    await departmentService.deleteDepartment(id);
                    message.success('Đã xóa phòng ban thành công');
                    fetchDepartments();
                } catch (error) {
                    message.error(error.response?.data?.message || 'Không thể xóa phòng ban');
                }
            },
        });
    };

    const handleEdit = (record) => {
        setEditingDept(record);
        form.setFieldsValue({
            name: record.name,
            description: record.description,
            location: record.location,
            head_id: record.head_id,
            department_type: record.department_type,
            department_code: record.department_code,
        });
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingDept(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();

            // Map form -> backend fields (department_code, department_name, department_type, description)
            const department_code = values.department_code
                || editingDept?.department_code
                || (values.name ? values.name.trim().toUpperCase().replace(/\s+/g, '_') : 'DEPT');
            const payload = {
                department_code,
                department_name: values.name,
                department_type: values.department_type || editingDept?.department_type || 'simple',
                description: values.description || '',
            };

            if (editingDept) {
                await departmentService.updateDepartment(editingDept.id, payload);
                message.success('Cập nhật phòng ban thành công');
            } else {
                await departmentService.createDepartment(payload);
                message.success('Tạo phòng ban thành công');
            }

            setIsModalOpen(false);
            fetchDepartments();
        } catch (error) {
            if (error.response) {
                message.error(error.response?.data?.message || 'Có lỗi xảy ra');
            }
        }
    };

    const handleViewMembers = async (department) => {
        setSelectedDepartmentName(department.name);
        setIsMembersModalOpen(true);
        setMembersLoading(true);
        try {
            const result = await departmentService.getDepartmentMembers(department.id);
            // Result is expected to be { success: true, data: [...] } or just [...] depending on service/backend wrapper
            // Based on departmentService.js: return response.data
            // Based on departmentController.js: res.json({ success: true, data: members })
            const members = result.data || result;
            setDepartmentMembers(Array.isArray(members) ? members : []);
        } catch (error) {
            message.error("Không thể tải danh sách thành viên");
            console.error(error);
        } finally {
            setMembersLoading(false);
        }
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
            title: 'Trưởng Bộ Phận',
            dataIndex: 'head',
            key: 'head',
            render: (head) => head ? (
                <div>
                    <div className="font-medium text-slate-800">{head.name}</div>
                    <div className="text-xs text-slate-500">{head.email}</div>
                </div>
            ) : <span className="text-slate-400 italic text-xs">Chưa bổ nhiệm</span>,
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            render: (text) => text || <span className="text-slate-400 italic text-xs">Chưa có</span>,
        },
        {
            title: 'Cập Nhật',
            dataIndex: 'updated_at',
            key: 'updated_at',
            render: (date) => <span className="text-slate-500 text-sm">{date ? new Date(date).toLocaleDateString('vi-VN') : '-'}</span>
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
                        <Button
                            type="text"
                            icon={<TeamOutlined className="text-green-600" />}
                            onClick={() => handleViewMembers(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const filteredData = departments.filter(d =>
        (d.name || '').toLowerCase().includes(searchText.toLowerCase())
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
                variant="borderless"
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
                <Spin spinning={loading}>
                    <Table
                        columns={columns}
                        dataSource={filteredData}
                        // Provide stable fallback keys to avoid React key warnings
                        rowKey={(record) => record.id || record.department_id || record.name || `dept-${record.location || ''}`}
                        pagination={{ pageSize: 6, placement: 'bottomRight' }}
                    />
                </Spin>
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
                        name="description"
                        label="Mô tả"
                    >
                        <Input.TextArea placeholder="Mô tả về phòng ban" rows={3} />
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
                </Form>
            </Modal>

            {/* View Members Modal */}
            <Modal
                title={`Danh sách thành viên - ${selectedDepartmentName}`}
                open={isMembersModalOpen}
                onCancel={() => setIsMembersModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsMembersModalOpen(false)}>
                        Đóng
                    </Button>
                ]}
                width={800}
            >
                <Table
                    dataSource={departmentMembers}
                    loading={membersLoading}
                    rowKey="user_id"
                    pagination={{ pageSize: 5 }}
                    columns={[
                        {
                            title: 'Họ và tên',
                            dataIndex: 'full_name',
                            key: 'full_name',
                            render: (text) => <span className="font-medium">{text}</span>
                        },
                        {
                            title: 'Email',
                            dataIndex: 'email',
                            key: 'email',
                        },
                        {
                            title: 'Số điện thoại',
                            dataIndex: 'phone',
                            key: 'phone',
                            render: (text) => text || <span className="text-slate-400 italic">Chưa cập nhật</span>
                        },
                        {
                            title: 'Vai trò',
                            dataIndex: 'role_name',
                            key: 'role_name',
                            render: (text) => (
                                <Tag color={text === 'Manager' ? 'blue' : 'default'}>
                                    {text || 'Nhân viên'}
                                </Tag>
                            )
                        },
                        {
                            title: 'Trạng thái',
                            dataIndex: 'status',
                            key: 'status',
                            render: (status) => (
                                <Tag color={status === 'active' ? 'success' : 'error'}>
                                    {status === 'active' ? 'Hoạt động' : 'Vô hiệu hóa'}
                                </Tag>
                            )
                        }
                    ]}
                />
            </Modal>
        </div>
    );
};

export default DepartmentManagement;