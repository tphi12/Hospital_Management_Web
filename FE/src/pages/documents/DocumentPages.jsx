import { useState, useEffect } from "react";
import {
    Table,
    Button,
    Input,
    Modal,
    Space,
    Tag,
    Tooltip,
    message,
    Card,
    Typography,
    Breadcrumb,
    Spin
} from "antd";
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    EyeOutlined,
    SearchOutlined,
    FilePdfOutlined,
    FileWordOutlined,
    FileOutlined,
    FileProtectOutlined
} from "@ant-design/icons"; // Check icons availability
import { documentService } from "../../services/documentService";

const { Title, Text } = Typography;
const { TextArea } = Input;

export const DocumentApprovals = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");

    // Modal states
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchPendingDocuments();
    }, []);

    const fetchPendingDocuments = async () => {
        setLoading(true);
        try {
            const result = await documentService.getAllDocuments({ status: 'pending' });
            // API might return { success: true, data: [...] } or just [...]
            const docs = result.data || result;
            setDocuments(Array.isArray(docs) ? docs : []);
        } catch (error) {
            console.error(error);
            message.error("Không thể tải danh sách tài liệu chờ duyệt");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchText(e.target.value.toLowerCase());
    };

    const filteredDocuments = documents.filter(doc =>
        (doc.title?.toLowerCase().includes(searchText)) ||
        (doc.uploaded_by_name?.toLowerCase().includes(searchText))
    );

    // Approval Handlers
    const openApproveModal = (doc) => {
        setSelectedDocument(doc);
        setIsApproveModalOpen(true);
    };

    const confirmApprove = async () => {
        if (!selectedDocument) return;
        setActionLoading(true);
        try {
            await documentService.approveDocument(selectedDocument.document_id);
            message.success(`Đã duyệt tài liệu "${selectedDocument.title}"`);
            setIsApproveModalOpen(false);
            fetchPendingDocuments(); // Refresh list
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi duyệt tài liệu');
        } finally {
            setActionLoading(false);
            setSelectedDocument(null);
        }
    };

    // Rejection Handlers
    const openRejectModal = (doc) => {
        setSelectedDocument(doc);
        setRejectReason("");
        setIsRejectModalOpen(true);
    };

    const confirmReject = async () => {
        if (!selectedDocument) return;
        setActionLoading(true);
        try {
            await documentService.rejectDocument(selectedDocument.document_id, rejectReason);
            message.success(`Đã từ chối tài liệu "${selectedDocument.title}"`);
            setIsRejectModalOpen(false);
            fetchPendingDocuments(); // Refresh list
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi từ chối tài liệu');
        } finally {
            setActionLoading(false);
            setSelectedDocument(null);
        }
    };

    // Helper for file icons
    const getFileIcon = (fileName) => {
        if (!fileName) return <FileOutlined className="text-xl text-gray-500" />;
        if (fileName.endsWith('.pdf')) return <FilePdfOutlined className="text-xl text-red-500" />;
        if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return <FileWordOutlined className="text-xl text-blue-500" />;
        return <FileOutlined className="text-xl text-gray-500" />;
    };

    const columns = [
        {
            title: 'Tài liệu',
            key: 'document',
            render: (_, record) => (
                <Space>
                    <div className="p-2 bg-slate-100 rounded-lg">
                        {getFileIcon(record.file_name)}
                    </div>
                    <div>
                        <Text strong className="block">{record.title}</Text>
                        <Text type="secondary" className="text-xs">{record.file_name}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Người tạo',
            dataIndex: 'uploader', // Assuming API returns uploader object or we map it
            key: 'uploader',
            render: (_, record) => (
                <div>
                    {/* Adjust fields based on actual API response structure */}
                    <Text className="block font-medium">{record.uploaded_by_name || record.uploader?.full_name || 'N/A'}</Text>
                    <Text type="secondary" className="text-xs">{record.uploader?.email || 'N/A'}</Text>
                </div>
            )
        },
        {
            title: 'Phòng ban',
            key: 'department',
            render: (_, record) => (
                <Text>{record.department?.dept_name || record.department_name || 'N/A'}</Text>
            )
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            align: 'center',
            render: (date) => <Text className="text-sm">{date ? new Date(date).toLocaleDateString('vi-VN') : '-'}</Text>
        },
        {
            title: 'Trạng thái',
            key: 'status',
            align: 'center',
            render: () => <Tag color="warning">Chờ duyệt</Tag>
        },
        {
            title: 'Hành động',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="text"
                            icon={<EyeOutlined className="text-blue-500" />}
                            onClick={() => window.open(record.file_path, '_blank')}
                        />
                    </Tooltip>
                    <Tooltip title="Duyệt">
                        <Button
                            type="text"
                            icon={<CheckCircleOutlined className="text-green-600" />}
                            onClick={() => openApproveModal(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Từ chối">
                        <Button
                            type="text"
                            icon={<CloseCircleOutlined className="text-red-500" />}
                            onClick={() => openRejectModal(record)}
                        />
                    </Tooltip>
                </Space>
            )
        }
    ];

    return (
        <div className="space-y-4">
            <Breadcrumb
                items={[
                    { title: 'Trang chủ' },
                    { title: <span className="font-bold">Duyệt tài liệu</span> },
                ]}
            />

            <div className="flex justify-between items-center mb-6">
                <div>
                    <Title level={2} style={{ margin: 0 }}>
                        <FileProtectOutlined className="mr-2 text-blue-600" />
                        Duyệt tài liệu chờ phê duyệt
                    </Title>
                    <Text type="secondary">Quản lý và phê duyệt các tài liệu từ nhân viên trong phòng ban.</Text>
                </div>
            </div>

            <Card variant="borderless" className="shadow-sm">
                <div className="mb-4">
                    <Input
                        prefix={<SearchOutlined className="text-slate-400" />}
                        placeholder="Tìm kiếm tài liệu..."
                        className="max-w-md"
                        value={searchText}
                        onChange={handleSearch}
                        allowClear
                        size="large"
                    />
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredDocuments}
                    rowKey="document_id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: 'Không có tài liệu nào đang chờ duyệt' }}
                />
            </Card>

            {/* Approve Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2 text-green-600">
                        <CheckCircleOutlined /> <span>Xác nhận duyệt tài liệu</span>
                    </div>
                }
                open={isApproveModalOpen}
                onOk={confirmApprove}
                onCancel={() => setIsApproveModalOpen(false)}
                okText="Duyệt tài liệu"
                cancelText="Hủy"
                confirmLoading={actionLoading}
                okButtonProps={{ className: "bg-green-600 hover:bg-green-500" }}
            >
                <p>Bạn có chắc chắn muốn duyệt tài liệu <strong>"{selectedDocument?.title}"</strong>?</p>
                <p className="text-slate-500 text-sm">Sau khi duyệt, tài liệu sẽ được hiển thị cho tất cả nhân viên trong phòng ban.</p>
            </Modal>

            {/* Reject Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2 text-red-600">
                        <CloseCircleOutlined /> <span>Từ chối tài liệu</span>
                    </div>
                }
                open={isRejectModalOpen}
                onOk={confirmReject}
                onCancel={() => setIsRejectModalOpen(false)}
                okText="Từ chối"
                cancelText="Hủy"
                confirmLoading={actionLoading}
                okButtonProps={{ danger: true }}
            >
                <p>Bạn có chắc chắn muốn từ chối tài liệu <strong>"{selectedDocument?.title}"</strong>?</p>
                <div className="mt-4">
                    <Text strong>Lý do từ chối (không bắt buộc):</Text>
                    <TextArea
                        rows={3}
                        placeholder="Nhập lý do từ chối..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="mt-2"
                    />
                </div>
            </Modal>
        </div>
    );
};
