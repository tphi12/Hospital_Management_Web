import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    User,
    FileText,
    Calendar,
    Building2,
    ShieldCheck,
    Upload,
    CalendarDays,
    CalendarRange,
    LogOut
} from "lucide-react";
import hospitalLogoLarge from "../assets/hospital-logo-large.png";
import { useAuth } from "../hooks/useAuth";
import { ROLES } from "../lib/roles";

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
                    path: "/schedule/weekly",
                    icon: CalendarDays,
                    roles: [ROLES.DEPT_CLERK, ROLES.HEAD_OF_DEPT, ROLES.ADMIN, ROLES.KHTH, ROLES.STAFF, ROLES.HOSPITAL_CLERK]
                },
                {
                    label: "Lịch trực toàn viện",
                    path: "/schedule/master",
                    icon: CalendarRange,
                    roles: [ROLES.KHTH, ROLES.ADMIN, ROLES.STAFF, ROLES.HEAD_OF_DEPT, ROLES.DEPT_CLERK, ROLES.HOSPITAL_CLERK]
                },
            ]
        },
    ];

    return (
        <aside className="w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 overflow-y-auto z-50 flex flex-col transition-all duration-300">
            {/* Header / Logo */}
            <div className="p-6 flex items-center gap-3 border-b border-slate-100">
                <div className="w-10 h-10 flex items-center justify-center">
                    <img src={hospitalLogoLarge} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-base font-bold text-slate-800 tracking-wide">Thai An Hospital</h1>
            </div>

            <div className="flex-1 py-2 px-4 space-y-6">
                {MENUS.map((group, idx) => (
                    <div key={idx}>
                        {group.title && group.items.some(item => item.roles.includes(user.role)) && (
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-3 mt-4">
                                {group.title}
                            </h3>
                        )}
                        <div className="space-y-1">
                            {group.items.map((item, itemIdx) => {
                                if (!item.roles.includes(user.role)) return null;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={itemIdx}
                                        to={item.path}
                                        className={`
                                            flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                                            ${isActive
                                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            }
                                        `}
                                    >
                                        <item.icon size={18} className={isActive ? "text-white" : "text-slate-400"} />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer User Info */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
                <Link to="/profile" className="flex items-center gap-3 mb-4 hover:bg-white p-2 rounded-lg transition-colors cursor-pointer group">
                    <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm group-hover:border-blue-400">
                        <User size={18} className="group-hover:text-blue-500" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.role}</p>
                    </div>
                </Link>
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
