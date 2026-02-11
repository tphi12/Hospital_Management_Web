import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    InboxOutlined,
    UploadOutlined,
    CloudUploadOutlined,
    InfoCircleOutlined
} from "@ant-design/icons";
import {
    Upload,
    Form,
    Input,
    Select,
    Button,
    Card,
    Typography,
    message,
    Alert,
    Breadcrumb,
    Row,
    Col,
    App
} from "antd";
import { documentService, categoryService } from "../../services";

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;
const { Option } = Select;

const DocumentUpload = () => {
    const { message: messageApi } = App.useApp();
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState([]);
    const [categories, setCategories] = useState([]);
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();

    // Fetch categories on component mount
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await categoryService.getAllCategories();
            setCategories(response.data || []);
        } catch (error) {
            console.error('Fetch categories error:', error);
            messageApi.error('Lỗi tải danh mục');
            setCategories([]);
        }
    };

    const handleUpload = async (values) => {
        if (fileList.length === 0) {
            messageApi.error("Vui lòng chọn file tài liệu!");
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('title', values.title);
            formData.append('category_id', values.categoryId);
            if (values.description) {
                formData.append('description', values.description);
            }
            formData.append('file', fileList[0]);

            const response = await documentService.uploadDocument(formData);
            
            messageApi.success("Upload tài liệu thành công!");
            form.resetFields();
            setFileList([]);
            
            setTimeout(() => {
                try {
                    navigate('/documents/upload');
                } catch (navError) {
                    console.error('Navigation error:', navError);
                    window.location.href = '/documents/upload';
                }
            }, 1500);
        } catch (error) {
            console.error('Upload error:', error);
            const errorMessage = error.response?.data?.message || error.message || "Lỗi upload tài liệu. Vui lòng thử lại!";
            messageApi.error(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    const uploadProps = {
        onRemove: (file) => {
            const index = fileList.indexOf(file);
            const newFileList = fileList.slice();
            newFileList.splice(index, 1);
            setFileList(newFileList);
        },
        beforeUpload: (file) => {
            const isLt50M = file.size / 1024 / 1024 < 50;
            if (!isLt50M) {
                messageApi.error('File phải nhỏ hơn 50MB!');
                return Upload.LIST_IGNORE;
            }
            setFileList([file]); // Allow only 1 file
            return false;
        },
        fileList,
        maxCount: 1,
        accept: ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png",
    };

    return (
        <div className="space-y-6">
            <Breadcrumb
                items={[
                    { title: 'Trang chủ' },
                    { title: <span className="font-bold">Upload Tài liệu</span> },
                ]}
            />

            <div className="flex justify-between items-center">
                <div>
                    <Title level={2} style={{ margin: 0 }}>Kho tài liệu</Title>
                    <Text type="secondary">Tải lên tài liệu mới vào hệ thống lưu trữ tập trung.</Text>
                </div>
            </div>

            <Row gutter={24}>
                <Col xs={24} lg={16}>
                    <Card
                        title={<span className="font-bold">Form tải lên</span>}
                        variant="borderless"
                        className="shadow-sm"
                    >
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleUpload}
                        >
                            <Form.Item
                                label="Tên tài liệu"
                                name="title"
                                rules={[{ required: true, message: 'Vui lòng nhập tên tài liệu' }]}
                            >
                                <Input placeholder="Nhập tên tài liệu..." />
                            </Form.Item>

                            <Form.Item
                                label="Danh mục"
                                name="categoryId"
                                rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                            >
                                <Select 
                                    placeholder="Chọn danh mục"
                                    showSearch
                                    filterOption={(input, option) =>
                                        (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                >
                                    {categories.map(cat => (
                                        <Option key={cat.category_id} value={cat.category_id}>
                                            {cat.category_name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item label="Mô tả" name="description">
                                <Input.TextArea placeholder="Mô tả ngắn gọn..." rows={3} />
                            </Form.Item>

                            <Form.Item label="File đính kèm" required tooltip="File PDF, Word, Excel, Ảnh. Max 50MB.">
                                <Dragger {...uploadProps} style={{ padding: '20px 0' }}>
                                    <p className="ant-upload-drag-icon">
                                        <InboxOutlined style={{ color: '#1677ff' }} />
                                    </p>
                                    <p className="ant-upload-text">Kéo thả file vào đây hoặc click để chọn</p>
                                    <p className="ant-upload-hint">
                                        Hỗ trợ định dạng: PDF, Word, Excel, JPG, PNG.
                                    </p>
                                </Dragger>
                            </Form.Item>

                            <Form.Item className="mb-0 text-right">
                                <Button 
                                    type="primary" 
                                    htmlType="submit" 
                                    size="large" 
                                    icon={<CloudUploadOutlined />}
                                    loading={uploading}
                                    disabled={uploading}
                                >
                                    {uploading ? 'Đang upload...' : 'Upload Tài liệu'}
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card
                        className="bg-blue-50 border-blue-100 shadow-sm"
                        variant="borderless"
                    >
                        <div className="flex items-center gap-2 mb-4 text-blue-700">
                            <InfoCircleOutlined className="text-xl" />
                            <span className="font-bold text-lg">Hướng dẫn</span>
                        </div>
                        <ul className="list-disc pl-5 space-y-2 text-slate-700 text-sm">
                            <li><strong>Cấu trúc lưu trữ:</strong> Hệ thống tự động phân loại theo Phòng ban và Danh mục.</li>
                            <li><strong>Quyền hạn:</strong> Tài liệu công khai sẽ được nhìn thấy bởi toàn bộ nhân viên.</li>
                            <li><strong>Dung lượng:</strong> Tối đa 50MB mỗi file. Nếu file lớn hơn, vui lòng nén trước khi tải lên.</li>
                            <li><strong>Bảo mật:</strong> File được quét virus tự động sau khi tải lên.</li>
                        </ul>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default DocumentUpload;
