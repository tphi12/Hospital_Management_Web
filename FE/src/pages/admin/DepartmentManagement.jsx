import { useState, useEffect } from "react";
import {
    Table, Button, Input, Modal, Form, Select, Tag, Space, Tooltip, message, Card, Breadcrumb, Spin, Avatar, List, Popconfirm, Typography
} from "antd";
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    TeamOutlined, SearchOutlined,
    BankOutlined, UserAddOutlined, UserDeleteOutlined, UserOutlined
} from "@ant-design/icons";
import { departmentService, userService } from "../../services";

const { Text } = Typography;

const DepartmentManagement = () => {
    const [departments, setDepartments] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [form] = Form.useForm();

    // Members Modal state
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
    const [selectedDept, setSelectedDept] = useState(null);
    const [members, setMembers] = useState([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [addMemberVisible, setAddMemberVisible] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [addingMember, setAddingMember] = useState(false);

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
                    head: d.head || (d.manager_name ? { name: d.manager_name, email: d.manager_email } : null),
                    description: d.description || d.department_description || '',
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
            setUsers(mapped);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
    };

    const fetchMembers = async (deptId) => {
        setMembersLoading(true);
        try {
            const response = await departmentService.getDepartmentMembers(deptId);
            setMembers(response.data || []);
        } catch (error) {
            message.error("Không thể tải danh sách thành viên");
        } finally {
            setMembersLoading(false);
        }
    };

    const handleOpenMembers = (record) => {
        setSelectedDept(record);
        setIsMembersModalOpen(true);
        fetchMembers(record.id);
    };

    const handleAddMember = async () => {
        if (!selectedUserId) {
            message.warning("Vui lòng chọn thành viên");
            return;
        }
        setAddingMember(true);
        try {
            await departmentService.addMemberToDepartment(selectedDept.id, selectedUserId);
            message.success("Thêm thành viên thành công!");
            setSelectedUserId(null);
            setAddMemberVisible(false);
            fetchMembers(selectedDept.id);
            fetchDepartments(); // refresh member count
        } catch (error) {
            message.error(error.response?.data?.message || "Thêm thành viên thất bại");
        } finally {
            setAddingMember(false);
        }
    };

    const handleRemoveMember = async (userId) => {
        try {
            await departmentService.removeMemberFromDepartment(selectedDept.id, userId);
            message.success("Đã xóa thành viên khỏi phòng ban");
            fetchMembers(selectedDept.id);
            fetchDepartments();
        } catch (error) {
            message.error(error.response?.data?.message || "Xóa thành viên thất bại");
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

    // Users already not in this department
    const availableUsers = users.filter(u =>
        !members.some(m => m.user_id === u.id || m.user_id === u.user_id)
    );

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
                        <div className="text-xs text-slate-500">{record.department_code}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Thành viên',
            dataIndex: 'member_count',
            key: 'member_count',
            align: 'center',
            render: (count) => (
                <Tag color="blue" icon={<TeamOutlined />}>
                    {count || 0} người
                </Tag>
            ),
        },
        {
            title: 'Trưởng Phòng',
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
                    <Tooltip title="Xem & Quản lý thành viên">
                        <Button type="text" icon={<TeamOutlined className="text-green-600" />} onClick={() => handleOpenMembers(record)} />
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
                <Form form={form} layout="vertical" className="mt-4">
                    <Form.Item
                        name="name"
                        label="Tên phòng ban"
                        rules={[{ required: true, message: 'Vui lòng nhập tên phòng ban' }]}
                    >
                        <Input placeholder="Ví dụ: Khoa Nội Tiết" prefix={<BankOutlined />} />
                    </Form.Item>

                    <Form.Item name="description" label="Mô tả">
                        <Input.TextArea placeholder="Mô tả về phòng ban" rows={3} />
                    </Form.Item>

                    <Form.Item name="location" label="Địa điểm / Tầng">
                        <Select placeholder="Chọn vị trí">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <Select.Option key={i} value={`Tầng ${i}`}>Tầng {i}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="head_id"
                        label="Trưởng phòng"
                        tooltip="Chọn người quản lý phòng ban"
                    >
                        <Select placeholder="Chọn quản lý" allowClear showSearch filterOption={(input, option) =>
                            option.children.toLowerCase().includes(input.toLowerCase())
                        }>
                            {users.map(u => (
                                <Select.Option key={u.id} value={u.id}>{u.name} ({u.email})</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Members Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <TeamOutlined className="text-green-600" />
                        <span>Thành viên phòng ban: <strong>{selectedDept?.name}</strong></span>
                    </div>
                }
                open={isMembersModalOpen}
                onCancel={() => {
                    setIsMembersModalOpen(false);
                    setAddMemberVisible(false);
                    setSelectedUserId(null);
                }}
                footer={
                    <Button
                        type="primary"
                        icon={<UserAddOutlined />}
                        onClick={() => setAddMemberVisible(!addMemberVisible)}
                    >
                        {addMemberVisible ? 'Ẩn form' : 'Thêm thành viên'}
                    </Button>
                }
                width={600}
            >
                {/* Add Member Form */}
                {addMemberVisible && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="text-sm font-medium text-blue-700 mb-2">Chọn người dùng để thêm vào phòng ban:</div>
                        <Space.Compact className="w-full">
                            <Select
                                placeholder="Tìm kiếm người dùng..."
                                showSearch
                                className="w-full"
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                options={availableUsers.map(u => ({
                                    value: u.id,
                                    label: `${u.name} (${u.email})`,
                                }))}
                                value={selectedUserId}
                                onChange={setSelectedUserId}
                                allowClear
                            />
                            <Button
                                type="primary"
                                loading={addingMember}
                                onClick={handleAddMember}
                            >
                                Thêm
                            </Button>
                        </Space.Compact>
                    </div>
                )}

                {/* Members List */}
                <Spin spinning={membersLoading}>
                    {members.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <TeamOutlined style={{ fontSize: 36 }} />
                            <div className="mt-2">Phòng ban chưa có thành viên nào</div>
                        </div>
                    ) : (
                        <List
                            dataSource={members}
                            renderItem={(member) => (
                                <List.Item
                                    key={member.user_id}
                                    actions={[
                                        <Popconfirm
                                            key="remove"
                                            title="Xóa thành viên"
                                            description="Bạn có chắc chắn muốn xóa thành viên này khỏi phòng ban?"
                                            onConfirm={() => handleRemoveMember(member.user_id)}
                                            okText="Xóa"
                                            cancelText="Hủy"
                                            okButtonProps={{ danger: true }}
                                        >
                                            <Tooltip title="Xóa khỏi phòng ban">
                                                <Button type="text" danger icon={<UserDeleteOutlined />} size="small" />
                                            </Tooltip>
                                        </Popconfirm>
                                    ]}
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <Avatar icon={<UserOutlined />} className="bg-blue-500">
                                                {member.full_name?.charAt(0)}
                                            </Avatar>
                                        }
                                        title={<span className="font-medium">{member.full_name}</span>}
                                        description={
                                            <div className="text-xs text-slate-500 space-y-0.5">
                                                <div>{member.email}</div>
                                                {member.role_name && <Tag color="blue" className="mt-1">{member.role_name}</Tag>}
                                            </div>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    )}
                </Spin>
            </Modal>
        </div>
    );
};

export default DepartmentManagement;