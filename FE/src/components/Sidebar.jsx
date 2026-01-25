import { Link, useLocation } from "react-router-dom";
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
    LogOut
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { ROLES } from "../lib/roles";
import { cn } from "../lib/utils";

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    if (!user) return null;

    const MENUS = [
        {
            title: "", // Top level (no title for this specific item in group)
            items: [
                {
                    label: "Tổng quan",
                    path: "/",
                    icon: LayoutDashboard,
                    roles: Object.values(ROLES)
                },
            ]
        },
        {
            title: "QUẢN LÝ HỆ THỐNG",
            items: [
                {
                    label: "Người dùng",
                    path: "/admin/users",
                    icon: Users,
                    roles: [ROLES.ADMIN]
                },
                {
                    label: "Vai trò & Phân quyền",
                    path: "/admin/roles", // Placeholder route
                    icon: ShieldCheck,
                    roles: [ROLES.ADMIN]
                },
                {
                    label: "Phòng ban",
                    path: "/admin/departments",
                    icon: Building2,
                    roles: [ROLES.ADMIN]
                },
            ]
        },
        {
            title: "QUẢN LÝ TÀI LIỆU",
            items: [
                {
                    label: "Danh sách Tài liệu",
                    path: "/documents/repository",
                    icon: FileText,
                    roles: [ROLES.HOSPITAL_CLERK, ROLES.ADMIN, ROLES.HEAD_OF_DEPT, ROLES.STAFF] // Broad access for "Public" docs
                },
                {
                    label: "Upload tài liệu",
                    path: "/documents/upload",
                    icon: Upload,
                    roles: [ROLES.STAFF, ROLES.DEPT_CLERK, ROLES.HEAD_OF_DEPT, ROLES.ADMIN]
                },
            ]
        },
        {
            title: "QUẢN LÝ LỊCH",
            items: [
                {
                    label: "Lịch trực",
                    path: "/schedule/me",
                    icon: Calendar,
                    roles: [ROLES.STAFF, ROLES.DEPT_CLERK, ROLES.HEAD_OF_DEPT, ROLES.HOSPITAL_CLERK, ROLES.KHTH, ROLES.ADMIN]
                },
                {
                    label: "Lịch công tác tuần",
                    path: "/schedule/department",
                    icon: CalendarDays,
                    roles: [ROLES.DEPT_CLERK, ROLES.HEAD_OF_DEPT, ROLES.ADMIN]
                },
                {
                    label: "Tất cả Lịch trình",
                    path: "/schedule/master",
                    icon: CalendarRange,
                    roles: [ROLES.KHTH, ROLES.ADMIN]
                },
            ]
        },
    ];

    return (
        <aside className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col fixed left-0 top-0 z-10 transition-all font-sans">
            {/* Header */}
            <div className="h-24 flex items-center justify-center border-b border-transparent">
                <h1 className="text-xl font-bold text-slate-800 text-center px-4">
                    Quản lý bệnh viện
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto py-2 px-4 space-y-6">
                {MENUS.map((group, idx) => (
                    <div key={idx}>
                        {group.title && group.items.some(item => item.roles.includes(user.role)) && (
                            <h3 className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 mt-2">
                                {group.title}
                            </h3>
                        )}

                        <div className="space-y-1">
                            {group.items
                                .filter(item => item.roles.includes(user.role))
                                .map((item) => {
                                    const isActive = location.pathname === item.path;
                                    const Icon = item.icon;

                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                                isActive
                                                    ? "bg-slate-100 text-slate-900 font-semibold"
                                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            )}
                                        >
                                            <Icon size={18} strokeWidth={2} className={isActive ? "text-slate-900" : "text-slate-500"} />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                        </div>
                    </div>
                ))}
            </div>

            {/* User Footer */}
            <div className="p-4 border-t border-slate-100">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <img
                        src={user.avatar}
                        alt="User"
                        className="w-10 h-10 rounded-full bg-slate-100 object-cover border border-slate-200"
                    />
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.role}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                    <LogOut size={16} />
                    Đăng xuất
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
