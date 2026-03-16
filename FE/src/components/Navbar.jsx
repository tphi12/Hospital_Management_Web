import { useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
    BellOutlined,
    SettingOutlined,
    UserOutlined,
    LogoutOutlined,
    CalendarOutlined
} from "@ant-design/icons";
import { Layout, Button, Badge, Dropdown, Avatar, Breadcrumb, Space, theme } from "antd";

const { Header } = Layout;

// Đưa dictionary map tên route ra ngoài component
const ROUTE_NAMES = {
    admin: 'Quản trị',
    users: 'Người dùng',
    documents: 'Tài liệu',
    schedule: 'Lịch'
};

// Đưa menu tĩnh (Demo notification) ra ngoài để không tạo lại mỗi lần render
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

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const {
        token: { colorBgContainer },
    } = theme.useToken();

    // Dùng useMemo để tránh tính toán lại Breadcrumb mỗi khi re-render không cần thiết
    const breadcrumbItems = useMemo(() => {
        const pathSnippets = location.pathname.split('/').filter(i => i);
        const extraBreadcrumbItems = pathSnippets.map((_, index) => {
            const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
            const pathName = pathSnippets[index];
            const title = ROUTE_NAMES[pathName] || (pathName.charAt(0).toUpperCase() + pathName.slice(1));

            return {
                key: url,
                title: <Link to={url}>{title}</Link>,
            };
        });

        return [
            {
                key: '/',
                title: <Link to="/">Trang chủ</Link>,
            },
            ...extraBreadcrumbItems
        ];
    }, [location.pathname]);

    // User Dropdown Menu dùng useMemo vì nó có gọi function logout từ hook
    const userMenuProps = useMemo(() => ({
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
    }), [logout]);

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
            <Breadcrumb items={breadcrumbItems} />

            {/* Right Side Actions */}
            <Space size="large">
                <Button type="text" shape="circle" icon={<SettingOutlined />} />

                <Dropdown menu={notifMenuProps} trigger={['click']} placement="bottomRight">
                    <Badge dot>
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
        </Header>
    );
};

export default Navbar;
