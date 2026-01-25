import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    FileText,
    Calendar,
    ClipboardCheck,
    Settings,
    LogOut,
    Building2
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
            title: "General",
            items: [
                {
                    label: "Dashboard",
                    path: "/",
                    icon: LayoutDashboard,
                    roles: Object.values(ROLES) // All roles
                },
            ]
        },
        {
            title: "Management",
            items: [
                {
                    label: "Users",
                    path: "/admin/users",
                    icon: Users,
                    roles: [ROLES.ADMIN]
                },
                {
                    label: "Departments",
                    path: "/admin/departments",
                    icon: Building2,
                    roles: [ROLES.ADMIN]
                },
            ]
        },
        {
            title: "Documents",
            items: [
                {
                    label: "My Documents",
                    path: "/documents/upload",
                    icon: FileText,
                    roles: [ROLES.STAFF, ROLES.DEPT_CLERK, ROLES.HEAD_OF_DEPT]
                },
                {
                    label: "Approvals",
                    path: "/documents/approvals",
                    icon: ClipboardCheck,
                    roles: [ROLES.HEAD_OF_DEPT]
                },
                {
                    label: "Repository",
                    path: "/documents/repository",
                    icon: FileText,
                    roles: [ROLES.HOSPITAL_CLERK]
                },
            ]
        },
        {
            title: "Planning & Schedule",
            items: [
                {
                    label: "My Schedule",
                    path: "/schedule/me",
                    icon: Calendar,
                    roles: [ROLES.STAFF, ROLES.DEPT_CLERK, ROLES.HEAD_OF_DEPT, ROLES.HOSPITAL_CLERK]
                },
                {
                    label: "Dept Planning",
                    path: "/schedule/department",
                    icon: Calendar,
                    roles: [ROLES.DEPT_CLERK]
                },
                {
                    label: "Master Schedule",
                    path: "/schedule/master",
                    icon: Calendar,
                    roles: [ROLES.KHTH, ROLES.ADMIN]
                },
            ]
        },
    ];

    return (
        <aside className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col fixed left-0 top-0 z-10 transition-all font-sans">
            <div className="h-16 flex items-center px-6 border-b border-slate-100">
                <div className="flex items-center gap-2 text-blue-600 font-bold text-xl tracking-tight">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center">
                        H
                    </div>
                    <span>MediManage</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
                {MENUS.map((group, idx) => (
                    <div key={idx}>
                        {group.items.some(item => item.roles.includes(user.role)) && (
                            <>
                                <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    {group.title}
                                </h3>
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
                                                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                                        isActive
                                                            ? "bg-blue-50 text-blue-700"
                                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                    )}
                                                >
                                                    <Icon size={18} />
                                                    {item.label}
                                                </Link>
                                            );
                                        })}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

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
                    Sign Out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
