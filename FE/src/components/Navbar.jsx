import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
    BellOutlined,
    SettingOutlined,
    UserOutlined,
    LogoutOutlined,
    CalendarOutlined
} from "@ant-design/icons";
import { Layout, Button, Badge, Dropdown, Avatar, Breadcrumb, Space } from "antd";

const { Header } = Layout;

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    // Removed unused theme variables

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

    // Notification Dropdown Menu (Demo)
    const notifMenuProps = {
        items: [
            {
                key: '1',
                label: (
                    <div className="py-1">
                        <div className="font-semibold">Tin nhắn mới</div>
                        <div className="text-xs text-gray-500">Từ Laur • 13 phút trước</div>
                    </div>
                ),
            },
            {
                key: '2',
                label: (
                    <div className="py-1">
                        <div className="font-semibold">Tài liệu mới</div>
                        <div className="text-xs text-gray-500">Đã tải lên • 1 ngày trước</div>
                    </div>
                ),
            },
        ],
    };

    return (
        <Header className="px-6 bg-white flex items-center justify-between sticky top-0 z-40 shadow-sm border-b border-slate-100 h-16 w-full">
            {/* Breadcrumb */}
            <Breadcrumb items={getBreadcrumbItems()} />

            {/* Right Side Actions */}
            <Space size="large">
                <Button type="text" shape="circle" icon={<SettingOutlined />} />

                <Dropdown menu={notifMenuProps} trigger={['click']} placement="bottomRight">
                    <Badge dot color="cyan">
                        <Button type="text" shape="circle" icon={<BellOutlined />} />
                    </Badge>
                </Dropdown>

                <Dropdown menu={userMenuProps} trigger={['click']}>
                    <Space className="cursor-pointer hover:bg-slate-50 p-1.5 rounded-full transition-colors">
                        <Avatar icon={<UserOutlined />} className="bg-cyan-100 text-cyan-600" />
                        <span className="text-sm font-medium text-slate-700 hidden sm:inline-block">
                            {user?.name || "Tài khoản"}
                        </span>
                    </Space>
                </Dropdown>
            </Space>
        </Header>
    );
};

export default Navbar;
