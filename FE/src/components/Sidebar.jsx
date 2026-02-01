import { useNavigate, useLocation, Link } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    FileText,
    Calendar,
    Building2,
    ShieldCheck,
    Upload,
    CalendarDays,
    CalendarRange,
    LogOut,
    User
} from "lucide-react";
import { Menu, Button, Avatar, Divider } from "antd";
import hospitalLogoLarge from "../assets/hospital-logo-large.png";
import { useAuth } from "../hooks/useAuth";
import { ROLES } from "../lib/roles";

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    if (!user) return null;

    // Helper to generate menu items
    const getItem = (label, key, icon, roles, type) => {
        return {
            key,
            icon,
            label,
            roles,
            type,
        };
    };

    // Define items structure with role check inside map
    const items = [
        {
            type: 'group', label: 'TỔNG QUAN', children: [
                { key: '/', icon: <LayoutDashboard size={18} />, label: 'Tổng quan', roles: Object.values(ROLES) }
            ]
        },
        {
            type: 'group', label: 'HỆ THỐNG', children: [
                { key: '/admin/users', icon: <Users size={18} />, label: 'Người dùng', roles: [ROLES.ADMIN] },
                { key: '/admin/roles', icon: <ShieldCheck size={18} />, label: 'Phân quyền', roles: [ROLES.ADMIN] },
                { key: '/admin/departments', icon: <Building2 size={18} />, label: 'Phòng ban', roles: [ROLES.ADMIN] },
            ]
        },
        {
            type: 'group', label: 'TÀI LIỆU', children: [
                { key: '/documents/repository', icon: <FileText size={18} />, label: 'Kho tài liệu', roles: [ROLES.HOSPITAL_CLERK, ROLES.ADMIN, ROLES.HEAD_OF_DEPT, ROLES.STAFF] },
                { key: '/documents/upload', icon: <Upload size={18} />, label: 'Upload', roles: [ROLES.STAFF, ROLES.DEPT_CLERK, ROLES.HEAD_OF_DEPT, ROLES.ADMIN] },
            ]
        },
        {
            type: 'group', label: 'LỊCH TRỰC', children: [
                { key: '/schedule/me', icon: <Calendar size={18} />, label: 'Lịch cá nhân', roles: [ROLES.STAFF, ROLES.DEPT_CLERK, ROLES.HEAD_OF_DEPT, ROLES.HOSPITAL_CLERK, ROLES.KHTH, ROLES.ADMIN] },
                { key: '/schedule/weekly', icon: <CalendarDays size={18} />, label: 'Lịch tuần', roles: [ROLES.DEPT_CLERK, ROLES.HEAD_OF_DEPT, ROLES.ADMIN, ROLES.KHTH, ROLES.STAFF, ROLES.HOSPITAL_CLERK] },
                { key: '/schedule/master', icon: <CalendarRange size={18} />, label: 'Toàn viện', roles: [ROLES.KHTH, ROLES.ADMIN, ROLES.STAFF, ROLES.HEAD_OF_DEPT, ROLES.DEPT_CLERK, ROLES.HOSPITAL_CLERK] },
            ]
        },
    ];

    // Filter items based on role
    const getFilteredItems = (menuItems) => {
        return menuItems.map(group => {
            const filteredChildren = group.children.filter(child => child.roles.includes(user.role));
            if (filteredChildren.length > 0) {
                return {
                    ...group,
                    children: filteredChildren,
                    type: 'group' // Ensure it's treated as a group in Ant Menu
                };
            }
            return null;
        }).filter(Boolean);
    };

    const menuItems = getFilteredItems(items);

    return (
        <aside className="w-[260px] bg-white h-screen fixed left-0 top-0 z-50 flex flex-col border-r border-slate-200">
            {/* Logo */}
            <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
                <img src={hospitalLogoLarge} alt="Logo" className="w-8 h-8 object-contain" />
                <span className="font-bold text-lg text-slate-800 tracking-tight">Thai An Hospital</span>
            </div>

            {/* Ant Design Menu */}
            <div className="flex-1 overflow-y-auto py-4">
                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={({ key }) => navigate(key)}
                    style={{ borderRight: 0 }}
                    className="custom-sidebar-menu text-slate-600"
                />
            </div>
        </aside>
    );
};

export default Sidebar;
