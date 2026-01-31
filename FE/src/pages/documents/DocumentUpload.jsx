import { useState } from "react";
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
    Col
} from "antd";

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;
const { Option } = Select;

const CATEGORIES = [
    { id: 1, name: "Hành chính" },
    { id: 2, name: "Chuyên môn" },
    { id: 3, name: "Đào tạo" },
    { id: 4, name: "Quy trình" },
];

const DEPARTMENTS = [
    { id: 1, name: "Khoa Nội" },
    { id: 2, name: "Khoa Ngoại" },
    { id: 3, name: "Khoa Sản" },
    { id: 4, name: "Phòng Tài Chính Kế Toán" },
    { id: 5, name: "Phòng Kỹ Thuật" },
];

const DocumentUpload = () => {
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState([]);

    const handleUpload = (values) => {
        if (fileList.length === 0) {
            message.error("Vui lòng chọn file tài liệu!");
            return;
        }

        console.log("Upload values:", values);
        console.log("File:", fileList[0]);

        // Mock success
        message.success("Upload tài liệu thành công!");
        form.resetFields();
        setFileList([]);
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
                message.error('File phải nhỏ hơn 50MB!');
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
                        bordered={false}
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

                            <Row gutter={16}>
                                <Col xs={12}>
                                    <Form.Item
                                        label="Danh mục"
                                        name="categoryId"
                                        rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                                    >
                                        <Select placeholder="Chọn danh mục">
                                            {CATEGORIES.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={12}>
                                    <Form.Item label="Phòng ban" name="deptId">
                                        <Select placeholder="Chọn phòng ban">
                                            {DEPARTMENTS.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

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
                                <Button type="primary" htmlType="submit" size="large" icon={<CloudUploadOutlined />}>
                                    Upload Tài liệu
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card
                        className="bg-blue-50 border-blue-100 shadow-sm"
                        bordered={false}
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
