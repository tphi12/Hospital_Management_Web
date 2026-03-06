// DocumentApprovals moved to src/pages/documents/DocumentApprovals.jsx
import { useState, useEffect, useCallback } from "react";
import {
    SearchOutlined,
    EyeOutlined,
    DownloadOutlined,
    EditOutlined,
    DeleteOutlined,
    FilePdfOutlined,
    FileExcelOutlined,
    FileWordOutlined,
    FileOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined
} from "@ant-design/icons";
import {
    Table,
    Button,
    Input,
    Select,
    Tag,
    Space,
    Tooltip,
    Modal,
    Card,
    Breadcrumb,
    Typography,
    Form,
    Row,
    Col,
    Descriptions,
    Spin,
    Popconfirm,
    App
} from "antd";
import { documentService, categoryService, userService } from "../../services";

const { Title, Text } = Typography;
const { Search } = Input;

const DocumentApprovals = () => {
    const { message: messageApi } = App.useApp();
    const [documents, setDocuments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentDoc, setCurrentDoc] = useState(null);
    const [form] = Form.useForm();

    // Fetch documents and categories on component mount

    const fetchPendingDocuments = useCallback(async () => {
        setLoading(true);
        try {
            const response = await documentService.getAllDocuments({ status: 'pending' });
            setDocuments(response.data || []);
        } catch (error) {
            console.error('Fetch documents error:', error);
            messageApi.error('Lỗi tải danh sách tài liệu');
            setDocuments([]);
        } finally {
            setLoading(false);
        }
    }, [messageApi]);

    const fetchCategories = useCallback(async () => {
        try {
            const response = await categoryService.getAllCategories();
            setCategories(response.data || []);
        } catch (error) {
            console.error('Fetch categories error:', error);
            setCategories([]);
        }
    }, []);

    useEffect(() => {
        fetchPendingDocuments();
        fetchCategories();
    }, [fetchPendingDocuments, fetchCategories]);

    const handleView = (doc) => {
        setCurrentDoc(doc);
        setIsViewModalOpen(true);
    };

    const handleDownload = async (doc) => {
        if (!doc.document_id) {
            messageApi.warning('Không tìm thấy tài liệu');
            return;
        }

        const hideLoading = messageApi.loading('Đang tải file...', 0);

        try {
            // Download through backend API to avoid CORS
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const downloadUrl = `${apiUrl}/documents/${doc.document_id}/download`;

            console.log('Downloading from:', downloadUrl);

            // Fetch with authorization
            const response = await fetch(downloadUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Response status:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Download error response:', errorText);
                throw new Error(`Download failed: ${response.status} ${response.statusText}`);
            }

            // Get blob from response
            const blob = await response.blob();
            console.log('Blob size:', blob.size, 'type:', blob.type);

            // Create download URL
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = doc.file_name || 'document';
            link.style.display = 'none';

            document.body.appendChild(link);
            link.click();

            // Cleanup after a short delay
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            }, 100);

            hideLoading();
            messageApi.success('Tải file thành công!');
        } catch (error) {
            hideLoading();
            console.error('Download error:', error);

            // Check if it's a network error
            if (error.message.includes('Failed to fetch')) {
                messageApi.error('Không thể kết nối đến server. Vui lòng kiểm tra xem backend đang chạy?');
            } else {
                messageApi.error(`Lỗi tải file: ${error.message}`);
            }
        }
    };

    const handleSearch = () => {
        fetchPendingDocuments(searchText);
    };

    const getFileIcon = (path) => {
        if (!path) return <FileOutlined className="text-gray-500 text-xl" />;
        const lowerPath = path.toLowerCase();
        if (lowerPath.endsWith('.pdf')) return <FilePdfOutlined className="text-red-500 text-xl" />;
        if (lowerPath.endsWith('.xls') || lowerPath.endsWith('.xlsx')) return <FileExcelOutlined className="text-green-600 text-xl" />;
        if (lowerPath.endsWith('.doc') || lowerPath.endsWith('.docx')) return <FileWordOutlined className="text-blue-600 text-xl" />;
        return <FileOutlined className="text-orange-500 text-xl" />;
    };

    const getStatusTag = (status) => {
        switch (status) {
            case 'approved': return <Tag icon={<CheckCircleOutlined />} color="success">Đã duyệt</Tag>;
            case 'pending': return <Tag icon={<ClockCircleOutlined />} color="warning">Chờ duyệt</Tag>;
            case 'rejected': return <Tag icon={<CloseCircleOutlined />} color="error">Từ chối</Tag>;
            default: return <Tag>{status}</Tag>;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';
            return date.toLocaleDateString('vi-VN');
        } catch {
            return '-';
        }
    };

    const handleApprove = async (record) => {
        try {
            await documentService.approveDocument(record.document_id);
            messageApi.success("Phê duyệt tài liệu thành công");
            fetchPendingDocuments();
        } catch (error) {
            console.error("Lỗi phê duyệt tài liệu", error);
            messageApi.error("Lỗi phê duyệt tài liệu");
        }
    };

    const handleReject = async (record) => {
        try {
            await documentService.rejectDocument(record.document_id, null);
            messageApi.success("Từ chối tài liệu thành công");
            fetchPendingDocuments();
        } catch (error) {
            console.error("Lỗi từ chối tài liệu", error);
            messageApi.error("Lỗi từ chối tài liệu");
        }
    };

    const columns = [
        {
            title: 'Tài liệu',
            key: 'title',
            render: (_, record) => (
                <Space>
                    {getFileIcon(record.file_name || record.file_path)}
                    <div>
                        <Text strong className="block">{record.title}</Text>
                        <Text type="secondary" className="text-xs">{record.file_name}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Người tạo',
            key: 'uploaded_by',
            render: (_, record) => <Text>{record.uploaded_by_name || '-'}</Text>,
        },
        {
            title: 'Phòng ban',
            dataIndex: 'department_name',
            key: 'department_name',
            render: (text) => text || '-',
        },
        {
            title: 'Danh mục',
            dataIndex: 'category_name',
            key: 'category_name',
            render: (text) => text || '-',
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            align: 'center',
            render: (date) => formatDate(date),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            align: 'center',
            render: (status) => getStatusTag(status),
        },
        {
            title: 'Hành động',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Xem chi tiết">
                        <Button type="text" icon={<EyeOutlined />} className="text-blue-500" onClick={() => handleView(record)} />
                    </Tooltip>
                    <Tooltip title="Tải xuống">
                        <Button type="text" icon={<DownloadOutlined />} className="text-green-600" onClick={() => handleDownload(record)} />
                    </Tooltip>
                    <Tooltip title="Duyệt">
                        <Button type="text" icon={<CheckCircleOutlined />} className="text-green-600" onClick={() => handleApprove(record)} />
                    </Tooltip>
                    <Tooltip title="Từ chối">
                        <Button type="text" icon={<CloseCircleOutlined />} className="text-red-600" onClick={() => handleReject(record)} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div className="space-y-4 h-[calc(100vh-80px)] flex flex-col">
            <Breadcrumb
                items={[
                    { title: 'Trang chủ' },
                    { title: 'Tài liệu' },
                    { title: <span className="font-bold">Duyệt tài liệu</span> },
                ]}
            />

            <div className="flex justify-between items-center">
                <div>
                    <Title level={2} style={{ margin: 0 }}>Duyệt tài liệu</Title>
                    <Text type="secondary">Duyệt tài liệu từ các khoa phòng.</Text>
                </div>
            </div>

            <Card
                variant="borderless"
                className="shadow-sm flex-1 flex flex-col overflow-hidden"
                styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
            >
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <Search
                        placeholder="Tìm kiếm tài liệu..."
                        allowClear
                        enterButton={<SearchOutlined />}
                        size="middle"
                        onSearch={handleSearch}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 400 }}
                    />
                </div>

                <Spin spinning={loading}>
                    <Table
                        columns={columns}
                        dataSource={documents}
                        rowKey="document_id"
                        pagination={{ pageSize: 8, placement: ['bottomCenter'] }}
                        scroll={{ y: 'calc(100vh - 300px)' }}
                        className="flex-1"
                    />
                </Spin>
            </Card>

            {/* View Modal */}
            <Modal
                title={<Space><CheckCircleOutlined /> Chi tiết tài liệu</Space>}
                open={isViewModalOpen}
                onCancel={() => setIsViewModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsViewModalOpen(false)}>Đóng</Button>
                ]}
                width={700}
            >
                {currentDoc && (
                    <Descriptions bordered column={1} size="small" labelStyle={{ width: '150px', fontWeight: 'bold' }}>
                        <Descriptions.Item label="ID Tài liệu">{currentDoc.document_id}</Descriptions.Item>
                        <Descriptions.Item label="Tiêu đề">{currentDoc.title}</Descriptions.Item>
                        <Descriptions.Item label="Phòng ban">{currentDoc.department_name || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Danh mục">{currentDoc.category_name || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">{getStatusTag(currentDoc.status)}</Descriptions.Item>
                        <Descriptions.Item label="File">{currentDoc.file_name}</Descriptions.Item>
                        <Descriptions.Item label="Kích thước">{currentDoc.file_size ? `${(currentDoc.file_size / 1024 / 1024).toFixed(2)} MB` : '-'}</Descriptions.Item>
                        <Descriptions.Item label="Người tải lên">{currentDoc.uploaded_by_name}</Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">{formatDate(currentDoc.created_at)}</Descriptions.Item>
                        <Descriptions.Item label="Người duyệt">{currentDoc.approved_by_name || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Ngày duyệt">{formatDate(currentDoc.approved_at)}</Descriptions.Item>
                        <Descriptions.Item label="File URL">
                            <Button
                                type="link"
                                size="small"
                                icon={<DownloadOutlined />}
                                onClick={() => handleDownload(currentDoc)}
                            >
                                Tải xuống
                            </Button>
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>

            {/* Edit Modal */}
            <Modal
                title={<Space><CloseCircleOutlined /> Chỉnh sửa tài liệu</Space>}
                open={isEditModalOpen}

                onCancel={() => setIsEditModalOpen(false)}
                okText="Cập nhật"
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="title" label="Tên tài liệu" rules={[{ required: true, message: 'Vui lòng nhập tên tài liệu' }]}>
                        <Input placeholder="Nhập tên tài liệu" />
                    </Form.Item>
                    <Form.Item name="category_id" label="Danh mục" rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}>
                        <Select
                            placeholder="Chọn danh mục"
                            showSearch
                            filterOption={(input, option) =>
                                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {categories.map(cat => (
                                <Select.Option key={cat.category_id} value={cat.category_id}>
                                    {cat.category_name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default DocumentApprovals;

