import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useSocket";
import {
    BellOutlined,
    SettingOutlined,
    UserOutlined,
    LogoutOutlined,
    CalendarOutlined,
    FileOutlined,
    FilePdfOutlined,
    FileExcelOutlined,
    FileWordOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    DownloadOutlined
} from "@ant-design/icons";
import { Layout, Button, Badge, Dropdown, Avatar, Breadcrumb, Space, theme, Modal, Descriptions, Tag, App as AntdApp } from "antd";
import { useState } from "react";

const { Header } = Layout;

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const { notifications, clearNotifications } = useNotifications();
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [currentDoc, setCurrentDoc] = useState(null);
    const { message: messageApi } = AntdApp.useApp();

    const {
        token: { colorBgContainer },
    } = theme.useToken();

    // Generate Breadcrumb items based on path
    const getBreadcrumbItems = () => {
        const pathSnippets = location.pathname.split('/').filter(i => i);
        const extraBreadcrumbItems = pathSnippets.map((_, index) => {
            const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
            // Simple mapping for demo purposes
            let title = pathSnippets[index];
            if (title === 'admin') title = 'Quản trị';
            if (title === 'users') title = 'Người dùng';
            if (title === 'documents') title = 'Tài liệu';
            if (title === 'schedule') title = 'Lịch';

            return {
                key: url,
                title: <Link to={url}>{title.charAt(0).toUpperCase() + title.slice(1)}</Link>,
            };
        });

        return [
            {
                key: '/',
                title: <Link to="/">Trang chủ</Link>,
            },
        ].concat(extraBreadcrumbItems);
    };

    // User Dropdown Menu
    const userMenuProps = {
        items: [
            {
                key: 'profile',
                label: <Link to="/profile">Hồ sơ cá nhân</Link>,
                icon: <UserOutlined />,
            },
            {
                key: 'schedule',
                label: <Link to="/schedule/me">Lịch trực của tôi</Link>,
                icon: <CalendarOutlined />,
            },
            {
                type: 'divider',
            },
            {
                key: 'logout',
                label: 'Đăng xuất',
                icon: <LogoutOutlined />,
                danger: true,
                onClick: logout,
            },
        ],
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

    const handleNotificationClick = (notif) => {
        if (notif.data) {
            setCurrentDoc(notif.data);
            setIsViewModalOpen(true);
        }
    };

    // Notification Dropdown Menu
    const notifMenuProps = {
        items: notifications.length > 0 ? notifications.map((notif, idx) => ({
            key: `notif-${notif.id || idx}`,
            label: (
                <div
                    className="py-1 min-w-[250px] cursor-pointer hover:bg-slate-50 transition-colors p-2 rounded-md"
                    onClick={() => handleNotificationClick(notif)}
                >
                    <div className="font-semibold text-blue-600 mb-1">
                        {notif.type === 'NEW_DOCUMENT' ? `Tài liệu ${notif.data.title} mới` :
                            notif.type === 'APPROVE_DOCUMENT' ? `Tài liệu ${notif.data.title} đã duyệt` :
                                notif.type === 'REJECT_DOCUMENT' ? `Tài liệu ${notif.data.title} bị từ chối` : 'Thông báo'}
                    </div>
                    <div className="text-sm text-gray-800 line-clamp-2">{notif.message}</div>
                    {notif.timestamp && <div className="text-xs text-slate-400 mt-1">{formatDate(notif.timestamp)}</div>}
                </div>
            ),
        })) : [
            {
                key: 'empty',
                label: <div className="py-2 text-center text-gray-500">Không có thông báo mới</div>,
                disabled: true
            }
        ],
    };

    // Add a clear all button if there are notifications
    if (notifications.length > 0) {
        notifMenuProps.items.push({ type: 'divider' });
        notifMenuProps.items.push({
            key: 'clear',
            label: <div onClick={clearNotifications} className="text-center text-blue-500 cursor-pointer">Đánh dấu tất cả đã đọc</div>
        });
    }

    return (
        <Header
            style={{
                padding: '0 24px',
                background: colorBgContainer,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 40,
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)'
            }}
        >
            {/* Breadcrumb */}
            <Breadcrumb items={getBreadcrumbItems()} />

            {/* Right Side Actions */}
            <Space size="large">
                <Button type="text" shape="circle" icon={<SettingOutlined />} />

                <Dropdown menu={notifMenuProps} trigger={['click']} placement="bottomRight">
                    <Badge count={notifications.length} overflowCount={99}>
                        <Button type="text" shape="circle" icon={<BellOutlined />} />
                    </Badge>
                </Dropdown>

                <Dropdown menu={userMenuProps} trigger={['click']}>
                    <Space className="cursor-pointer hover:bg-slate-50 p-1.5 rounded-full transition-colors">
                        <Avatar icon={<UserOutlined />} className="bg-blue-100 text-blue-600" />
                        <span className="text-sm font-medium text-slate-700 hidden sm:inline-block">
                            {user?.name || "Tài khoản"}
                        </span>
                    </Space>
                </Dropdown>
            </Space>

            {/* View Document Modal */}
            <Modal
                title={<Space><FileOutlined /> Chi tiết tài liệu (Từ thông báo)</Space>}
                open={isViewModalOpen}
                onCancel={() => setIsViewModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsViewModalOpen(false)}>Đóng</Button>
                ]}
                width={700}
            >
                {currentDoc && (
                    <Descriptions bordered column={1} size="small" labelStyle={{ width: '150px', fontWeight: 'bold' }}>
                        <Descriptions.Item label="Tiêu đề">
                            <Space>
                                {getFileIcon(currentDoc.file_name)}
                                <span className="font-medium">{currentDoc.title}</span>
                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">{getStatusTag(currentDoc.status)}</Descriptions.Item>
                        <Descriptions.Item label="File">{currentDoc.file_name}</Descriptions.Item>
                        {currentDoc.file_size && (
                            <Descriptions.Item label="Kích thước">
                                {(currentDoc.file_size / 1024 / 1024).toFixed(2)} MB
                            </Descriptions.Item>
                        )}
                        {currentDoc.created_at && (
                            <Descriptions.Item label="Ngày tạo">{formatDate(currentDoc.created_at)}</Descriptions.Item>
                        )}
                        <Descriptions.Item label="File URL">
                            <Button
                                variant="contained"
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
        </Header>
    );
};

export default Navbar;
