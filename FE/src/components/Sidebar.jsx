import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  Building2,
  ShieldCheck,
  Upload,
  BookOpenCheck,
  CalendarDays,
  CalendarRange,
} from "lucide-react";
import { Menu, Spin } from "antd";
import hospitalLogoLarge from "../assets/hospital-logo-large.png";
import { useAuth } from "../hooks/useAuth";
import { getEffectiveRoleCodes, isHospitalScope } from "../lib/roleUtils";
import { ROLES } from "../lib/roles";

const MENU_CONFIG = [
  {
    groupLabel: "TONG QUAN",
    items: [
      {
        label: "Tong quan",
        path: "/",
        icon: <LayoutDashboard size={18} />,
        allowedRoles: [ROLES.ADMIN, ROLES.STAFF, ROLES.DEPT_CLERK, ROLES.HEAD_OF_DEPT, ROLES.HOSPITAL_CLERK, ROLES.KHTH],
      },
    ],
  },
  {
    groupLabel: "HE THONG",
    items: [
      { label: "Nguoi dung", path: "/admin/users", icon: <Users size={18} />, allowedRoles: [ROLES.ADMIN] },
      { label: "Phan quyen", path: "/admin/roles", icon: <ShieldCheck size={18} />, allowedRoles: [ROLES.ADMIN] },
      { label: "Phong ban", path: "/admin/departments", icon: <Building2 size={18} />, allowedRoles: [ROLES.ADMIN] },
    ],
  },
  {
    groupLabel: "TAI LIEU",
    items: [
      {
        label: "Kho tai lieu",
        path: "/documents/repository",
        icon: <FileText size={18} />,
        allowedRoles: [ROLES.ADMIN, ROLES.HOSPITAL_CLERK, ROLES.HEAD_OF_DEPT, ROLES.STAFF, ROLES.DEPT_CLERK],
      },
      {
        label: "Duyet tai lieu",
        path: "/documents/approvals",
        icon: <BookOpenCheck size={18} />,
        allowedRoles: [ROLES.ADMIN, ROLES.HOSPITAL_CLERK, ROLES.HEAD_OF_DEPT],
      },
      {
        label: "Upload",
        path: "/documents/upload",
        icon: <Upload size={18} />,
        allowedRoles: [ROLES.ADMIN, ROLES.DEPT_CLERK, ROLES.HEAD_OF_DEPT, ROLES.STAFF, ROLES.HOSPITAL_CLERK],
      },
    ],
  },
  {
    groupLabel: "LICH",
    items: [
      {
        label: "Lich da cong bo",
        path: "/schedule/me",
        icon: <Calendar size={18} />,
        allowedRoles: [ROLES.ADMIN, ROLES.DEPT_CLERK, ROLES.HEAD_OF_DEPT, ROLES.HOSPITAL_CLERK, ROLES.KHTH, ROLES.STAFF],
      },
      {
        label: "Upload lich truc",
        path: "/schedule/department",
        icon: <Upload size={18} />,
        allowedRoles: [ROLES.DEPT_CLERK, ROLES.ADMIN],
      },
      {
        label: "Duyet lich truc",
        path: "/schedule/master",
        icon: <CalendarRange size={18} />,
        allowedRoles: [ROLES.ADMIN, ROLES.KHTH],
      },
      {
        label: "Lich cong tac tuan",
        path: "/schedule/weekly",
        icon: <CalendarDays size={18} />,
        allowedRoles: [ROLES.ADMIN, ROLES.KHTH],
      },
    ],
  },
];

const Sidebar = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <aside className="w-[260px] bg-white h-screen fixed left-0 top-0 z-50 flex flex-col border-r border-slate-200">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
          <img src={hospitalLogoLarge} alt="Logo" className="w-8 h-8 object-contain" />
          <span className="font-bold text-lg text-slate-800 tracking-tight">Thai An Hospital</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Spin size="small" />
        </div>
      </aside>
    );
  }

  if (!user) return null;

  const roleCodes = getEffectiveRoleCodes(user);

  const canAccessItem = (menuItem) => {
    const hasAllowedRole = (menuItem.allowedRoles || []).some((role) => roleCodes.has(role));
    if (!hasAllowedRole) return false;
    if (menuItem.requireHospitalScope) {
      return isHospitalScope(user);
    }
    return true;
  };

  const menuItems = MENU_CONFIG.map((group) => {
    const children = group.items
      .filter(canAccessItem)
      .map((item) => ({
        key: item.path,
        icon: item.icon,
        label: item.label,
      }));

    if (!children.length) {
      return null;
    }

    return {
      type: "group",
      label: group.groupLabel,
      children,
    };
  }).filter(Boolean);

  return (
    <aside className="w-[260px] bg-white h-screen fixed left-0 top-0 z-50 flex flex-col border-r border-slate-200">
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
        <img src={hospitalLogoLarge} alt="Logo" className="w-8 h-8 object-contain" />
        <span className="font-bold text-lg text-slate-800 tracking-tight">Thai An Hospital</span>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
          className="custom-sidebar-menu"
        />
      </div>
    </aside>
  );
};

export default Sidebar;
