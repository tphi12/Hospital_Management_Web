import { useState } from "react";
import {
    SearchOutlined,
    EyeOutlined,
    DownloadOutlined,
    EditOutlined,
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
    Tag,
    Space,
    Tooltip,
    Modal,
    Card,
    Breadcrumb,
    Typography,
    message,
    Form,
    Row,
    Col,
    Descriptions
} from "antd";

const { Title, Text } = Typography;
const { Search } = Input;

/**
 * Mock Data
 */
const MOCK_DOCS = [
    {
        id: "KH_092023",
        title: "Kế hoạch khám sức khỏe định kỳ quý 3",
        creator: "Trần Văn Trọng",
        department: "Phòng Kế Hoạch",
        section: "Tổ Kế Hoạch 1",
        description: "Kế hoạch chi tiết phục vụ cán bộ nhân viên toàn viện.",
        file_path: "ke_hoach_kham_sk_q3.pdf",
        created_at: "25/08/2025",
        status: "approved",
        format: "PDF",
        keywords: "kham-suc-khoe, quy-3, ke-hoach"
    },
    {
        id: "BC_TC_2025",
        title: "Báo cáo tài chính năm 2025",
        creator: "Phạm Thị Hương",
        department: "Phòng Tài Chính",
        section: "Tổ Kế Toán",
        description: "Báo cáo tổng kết thu chi năm 2025.",
        file_path: "bao_cao_tai_chinh.xlsx",
        created_at: "10/01/2026",
        status: "pending",
        format: "Excel",
        keywords: "tai-chinh, bao-cao, nam-2025"
    },
    {
        id: "QT_01",
        title: "Quy trình tiếp nhận bệnh nhân cấp cứu",
        creator: "Nguyễn Văn A",
        department: "Khoa Cấp Cứu",
        section: "Hành chính khoa",
        description: "Quy trình chuẩn ISO về tiếp nhận bệnh nhân.",
        file_path: "quy_trinh_cc.docx",
        created_at: "15/09/2025",
        status: "rejected",
        format: "Word",
        keywords: "quy-trinh, cap-cuu, benh-nhan"
    },
    {
        id: "HD_SD_MAY",
        title: "Hướng dẫn sử dụng máy X-Quang mới",
        creator: "Lê Gia Nam",
        department: "Khoa Hình Ảnh",
        section: "Kỹ thuật",
        description: "Tài liệu trainning cho máy X-Quang KTS.",
        file_path: "hd_xquang.pdf",
        created_at: "20/01/2026",
        status: "approved",
        format: "PDF",
        keywords: "huong-dan, x-quang, may-moi"
    },
];

const DocumentList = () => {
    const [documents, setDocuments] = useState(MOCK_DOCS);
    const [searchText, setSearchText] = useState("");
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentDoc, setCurrentDoc] = useState(null);
    const [form] = Form.useForm();

    const handleView = (doc) => {
        setCurrentDoc(doc);
        setIsViewModalOpen(true);
    };

    const handleEdit = (doc) => {
        setCurrentDoc(doc);
        form.setFieldsValue(doc);
        setIsEditModalOpen(true);
    };

    const handleUpdate = () => {
        form.validateFields().then(values => {
            setDocuments(documents.map(d => d.id === currentDoc.id ? { ...d, ...values } : d));
            message.success("Cập nhật tài liệu thành công!");
            setIsEditModalOpen(false);
        });
    };

    const getFileIcon = (path) => {
        if (path.endsWith('.pdf')) return <FilePdfOutlined className="text-red-500 text-xl" />;
        if (path.endsWith('.xls') || path.endsWith('.xlsx')) return <FileExcelOutlined className="text-green-600 text-xl" />;
        if (path.endsWith('.doc') || path.endsWith('.docx')) return <FileWordOutlined className="text-blue-600 text-xl" />;
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

    const filteredData = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchText.toLowerCase()) ||
        doc.creator.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        {
            title: 'Tài liệu',
            key: 'title',
            render: (_, record) => (
                <Space>
                    {getFileIcon(record.file_path)}
                    <div>
                        <Text strong className="block">{record.title}</Text>
                        <Text type="secondary" className="text-xs">{record.file_path}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Người tạo',
            dataIndex: 'creator',
            key: 'creator',
            render: (text) => <Text>{text}</Text>,
        },
        {
            title: 'Phòng ban',
            dataIndex: 'department',
            key: 'department',
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            align: 'center',
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
                    <Tooltip title="Chỉnh sửa">
                        <Button type="text" icon={<EditOutlined />} className="text-orange-500" onClick={() => handleEdit(record)} />
                    </Tooltip>
                    <Tooltip title="Tải xuống">
                        <Button type="text" icon={<DownloadOutlined />} className="text-green-600" onClick={() => message.info(`Đang tải ${record.file_path}...`)} />
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
                    { title: <span className="font-bold">Danh sách</span> },
                ]}
            />

            <div className="flex justify-between items-center">
                <div>
                    <Title level={2} style={{ margin: 0 }}>Danh sách tài liệu</Title>
                    <Text type="secondary">Quản lý và tra cứu tài liệu từ các khoa phòng.</Text>
                </div>
            </div>

            <Card bordered={false} className="shadow-sm flex-1 flex flex-col overflow-hidden" bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <Search
                        placeholder="Tìm kiếm tài liệu..."
                        allowClear
                        enterButton={<SearchOutlined />}
                        size="middle"
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 400 }}
                    />
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="id"
                    pagination={{ pageSize: 8, position: ['bottomCenter'] }}
                    scroll={{ y: 'calc(100vh - 300px)' }}
                    className="flex-1"
                />
            </Card>

            {/* View Modal */}
            <Modal
                title={<Space><EyeOutlined /> Chi tiết tài liệu</Space>}
                open={isViewModalOpen}
                onCancel={() => setIsViewModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsViewModalOpen(false)}>Đóng</Button>
                ]}
                width={700}
            >
                {currentDoc && (
                    <Descriptions bordered column={1} size="small" labelStyle={{ width: '150px', fontWeight: 'bold' }}>
                        <Descriptions.Item label="ID Tài liệu">{currentDoc.id}</Descriptions.Item>
                        <Descriptions.Item label="Tiêu đề">{currentDoc.title}</Descriptions.Item>
                        <Descriptions.Item label="Phòng ban">{currentDoc.department}</Descriptions.Item>
                        <Descriptions.Item label="Tổ / Bộ phận">{currentDoc.section}</Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">{getStatusTag(currentDoc.status)}</Descriptions.Item>
                        <Descriptions.Item label="Định dạng">{currentDoc.format}</Descriptions.Item>
                        <Descriptions.Item label="Mô tả">{currentDoc.description}</Descriptions.Item>
                        <Descriptions.Item label="Từ khóa">
                            {currentDoc.keywords.split(',').map((tag, i) => (
                                <Tag key={i} color="blue">{tag.trim()}</Tag>
                            ))}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>

            {/* Edit Modal */}
            <Modal
                title={<Space><EditOutlined /> Chỉnh sửa tài liệu</Space>}
                open={isEditModalOpen}
                onOk={handleUpdate}
                onCancel={() => setIsEditModalOpen(false)}
                okText="Cập nhật"
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="title" label="Tên tài liệu" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="department" label="Phòng ban">
                        <Input />
                    </Form.Item>
                    <Form.Item name="section" label="Tổ / Bộ phận">
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item name="keywords" label="Từ khóa">
                        <Input placeholder="Ngăn cách bằng dấu phẩy" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default DocumentList;
