import { useState } from "react";
import { Shield, Info, Check, X, Plus, Save, Users, Lock, ChevronRight, AlertCircle, Search } from "lucide-react";
import { ROLES, ROLE_DETAILS, PERMISSIONS } from "../../lib/roles";

const RoleManagement = () => {
    // State
    const [selectedRole, setSelectedRole] = useState(ROLES.ADMIN);
    const [isEditing, setIsEditing] = useState(false);
    const [tempPermissions, setTempPermissions] = useState({});
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Convert PERMISSIONS object to array for easier mapping
    const permissionList = Object.values(PERMISSIONS);
    const roleList = Object.keys(ROLES);

    // Mock user counts per role
    const ROLE_COUNTS = {
        [ROLES.ADMIN]: 2,
        [ROLES.HOSPITAL_CLERK]: 5,
        [ROLES.HEAD_OF_DEPT]: 12,
        [ROLES.DEPT_CLERK]: 8,
        [ROLES.STAFF]: 45,
        [ROLES.KHTH]: 3,
    };

    // Helper to check if role has permission
    const hasPermission = (permissionKey, roleKey) => {
        // If we are editing, check the temp state first, otherwise check the static definition
        // For this demo, since roles.js is static, we just check the static file.
        // In a real app, this would check backend data.
        return PERMISSIONS[permissionKey]?.roles.includes(roleKey);
    };

    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        setIsEditing(false);
    };

    const handleSave = () => {
        // In a real app, this would send an API request
        setIsEditing(false);
        alert("Đã lưu thay đổi phân quyền (Demo)");
    };

    const currentRoleDetails = ROLE_DETAILS[selectedRole] || { label: selectedRole, description: "", color: "bg-slate-100" };

    return (
        <div className="animate-fade-in relative min-h-screen pb-20">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-slate-500 mb-4 px-1">
                <span>Trang chủ</span>
                <span className="mx-2">/</span>
                <span>Admin</span>
                <span className="mx-2">/</span>
                <span className="font-medium text-slate-900">Quản lý Phân quyền</span>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Shield className="text-pink-600" size={28} />
                        Quản lý Phân quyền & Vai trò
                    </h1>
                    <p className="text-slate-500 mt-1">Cấu hình quyền hạn truy cập cho từng vai trò trong hệ thống.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    Thêm vai trò mới
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Sidebar - Role List */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 p-3 border-b border-slate-100">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Danh sách Vai trò</h3>
                        </div>
                        <div className="p-2">
                            {roleList.map((role) => {
                                const details = ROLE_DETAILS[role];
                                const isActive = selectedRole === role;
                                return (
                                    <button
                                        key={role}
                                        onClick={() => handleRoleSelect(role)}
                                        className={`w-full text-left p-3 rounded-lg flex items-center justify-between group transition-all mb-1
                                            ${isActive ? 'bg-pink-50 border-pink-200 shadow-sm ring-1 ring-pink-500/20' : 'hover:bg-slate-50 border border-transparent'}`}
                                    >
                                        <div>
                                            <p className={`font-semibold text-sm ${isActive ? 'text-pink-700' : 'text-slate-700'}`}>
                                                {details?.label || role}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                                <Users size={10} /> {ROLE_COUNTS[role] || 0} người dùng
                                            </p>
                                        </div>
                                        {isActive && <ChevronRight size={16} className="text-pink-500" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick Stats or Tips */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-start gap-3">
                            <Info className="text-blue-600 mt-0.5 flex-shrink-0" size={18} />
                            <div>
                                <h4 className="text-sm font-bold text-blue-800 mb-1">Lưu ý quan trọng</h4>
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    Việc thay đổi quyền hạn sẽ ảnh hưởng ngay lập tức đến tất cả người dùng thuộc vai trò đó. Hãy cân nhắc kỹ trước khi lưu.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content - Permission Matrix */}
                <div className="lg:col-span-9 space-y-6">

                    {/* Role Header Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${currentRoleDetails.color}`}>
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">{currentRoleDetails.label}</h2>
                                    <code className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono mt-1 inline-block">
                                        {selectedRole}
                                    </code>
                                    <p className="text-slate-500 text-sm mt-2">{currentRoleDetails.description}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                                    >
                                        Chỉnh sửa quyền
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className="px-4 py-2 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700 shadow-sm transition-colors flex items-center gap-2"
                                        >
                                            <Save size={16} /> Lưu thay đổi
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Permissions Grid */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Lock size={18} className="text-slate-400" />
                                Bảng phân quyền chi tiết
                            </h3>
                            <div className="relative w-64">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm quyền hạn..."
                                    className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-pink-500 transition-colors"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {permissionList
                                .filter(p => p.label.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map((permission) => {
                                    const hasAccess = hasPermission(permission.id, selectedRole);

                                    return (
                                        <div key={permission.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                            <div className="pr-4">
                                                <p className="font-medium text-slate-900 text-sm">{permission.label}</p>
                                                <p className="text-xs text-slate-400 font-mono mt-0.5">{permission.id}</p>
                                            </div>

                                            <div className="flex items-center">
                                                {isEditing ? (
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            defaultChecked={hasAccess}
                                                        />
                                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                                                    </label>
                                                ) : (
                                                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5
                                                    ${hasAccess ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                        {hasAccess ? <Check size={12} /> : <X size={12} />}
                                                        {hasAccess ? "Được phép" : "Không được phép"}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Role Modal (Frontend Only Demo) */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1px] animate-fade-in">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4 overflow-hidden animate-scale-in">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800">Tạo vai trò mới</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Tên vai trò <span className="text-red-500">*</span></label>
                                <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500" placeholder="VD: Điều dưỡng trưởng" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Mã vai trò (System ID) <span className="text-red-500">*</span></label>
                                <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 font-mono" placeholder="VD: NURSE_MANAGER" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả</label>
                                <textarea className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500" rows="3" placeholder="Mô tả vai trò này..."></textarea>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg flex gap-2 items-start">
                                <Info size={16} className="text-blue-600 mt-0.5" />
                                <p className="text-xs text-blue-700">Sau khi tạo, bạn có thể cấu hình chi tiết quyền hạn ở màn hình chính.</p>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                            <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Hủy</button>
                            <button className="px-4 py-2 text-sm font-bold text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors shadow-sm">Tạo vai trò</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default RoleManagement;
