import { useState } from "react";
import {
    Search, Plus, Edit, Trash2, Users, MapPin, X, Save, Info, UserPlus,
    Pill, Stethoscope, Landmark, GraduationCap, Archive, BarChart, Activity, Building2,
    CheckCircle
} from "lucide-react";

/**
 * Mock Data
 */
const MOCK_USERS = [
    { id: 1, name: "Trần Văn Trọng", email: "trong@gmail.com" },
    { id: 2, name: "Lê Gia Nam", email: "nam@gmail.com" },
    { id: 3, name: "Nguyễn Văn A", email: "a@gmail.com" },
    { id: 4, name: "Phạm Thị B", email: "b@gmail.com" },
];

const INITIAL_DEPTS = [
    {
        id: 1,
        name: "Khoa Nội",
        location: "Tầng 3",
        manager: { id: 1, name: "Trần Văn Trọng", email: "trong@gmail.com" },
        users_count: 12,
        docs_count: 5,
        updated_at: "25/01/2026",
        members: [1, 3] // User IDs
    },
    {
        id: 2,
        name: "Phòng Tài Chính Kế Toán",
        location: "Tầng 5",
        manager: null,
        users_count: 4,
        docs_count: 120,
        updated_at: "24/01/2026",
        members: []
    },
    {
        id: 3,
        name: "Khoa Dược",
        location: "Tầng 1",
        manager: { id: 2, name: "Lê Gia Nam", email: "nam@gmail.com" },
        users_count: 8,
        docs_count: 45,
        updated_at: "20/01/2026",
        members: [2]
    },
];

const DepartmentManagement = () => {
    const [departments, setDepartments] = useState(INITIAL_DEPTS);
    const [searchTerm, setSearchTerm] = useState("");

    // Modals State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [viewingMembersDept, setViewingMembersDept] = useState(null);

    // Helper to get Icon
    const getDeptIcon = (name) => {
        const n = name.toLowerCase();
        if (n.includes('tài chính') || n.includes('kế toán')) return Landmark;
        if (n.includes('khám') || n.includes('nội') || n.includes('ngoại') || n.includes('sản')) return Stethoscope;
        if (n.includes('dược')) return Pill;
        if (n.includes('hành chính')) return Building2;
        if (n.includes('đào tạo')) return GraduationCap;
        if (n.includes('vật tư')) return Archive;
        if (n.includes('kế hoạch')) return BarChart;
        if (n.includes('điều dưỡng')) return Activity;
        return Building2;
    };

    const handleDelete = (id) => {
        if (window.confirm("Bạn có chắc muốn xóa phòng ban này? Tất cả thành viên và tài liệu liên quan có thể bị ảnh hưởng.")) {
            setDepartments(departments.filter(d => d.id !== id));
        }
    };

    const filteredDepts = departments.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in relative">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-slate-500 mb-4">
                <span>Trang chủ</span>
                <span className="mx-2">/</span>
                <span className="font-medium text-slate-900">Phòng ban</span>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="bg-slate-900 text-white p-4">
                    <h2 className="text-lg font-medium">Danh sách Phòng ban</h2>
                </div>

                {/* Toolbar */}
                <div className="p-4 flex flex-col md:flex-row gap-4 items-end justify-between border-b border-slate-100">
                    <div className="w-full md:w-auto flex-1"></div> {/* Spacer */}
                    <div className="flex gap-4 items-center w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Tìm kiếm phòng ban</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Search size={18} />
                                </div>
                                <input
                                    type="text"
                                    placeholder=""
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 text-sm"
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-colors shadow-sm h-[38px] mt-auto"
                        >
                            <Plus size={19} />
                            Tạo mới
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left align-middle">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3">Phòng ban</th>
                                <th className="px-6 py-3">Trưởng phòng</th>
                                <th className="px-6 py-3 text-center">Số nhân viên</th>
                                <th className="px-6 py-3 text-center">Số tài liệu</th>
                                <th className="px-6 py-3 text-center">Cập nhật</th>
                                <th className="px-6 py-3 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredDepts.length > 0 ? filteredDepts.map((dept) => {
                                const Icon = getDeptIcon(dept.name);
                                return (
                                    <tr key={dept.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="text-slate-300">
                                                    <Icon size={28} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm mb-0.5">{dept.name}</p>
                                                    <p className="text-slate-500 text-xs flex items-center gap-1">
                                                        {dept.location || 'Chưa có địa điểm'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            {dept.manager ? (
                                                <div>
                                                    <p className="font-bold text-xs text-slate-900">{dept.manager.name}</p>
                                                    <p className="text-slate-500 text-xs">{dept.manager.email}</p>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Chưa có trưởng phòng</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                                                {dept.users_count} nhân viên
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                                                {dept.docs_count} tài liệu
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <span className="text-slate-700 text-xs font-bold">{dept.updated_at}</span>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setEditingDept(dept)}
                                                    className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded transition-colors"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setViewingMembersDept(dept)}
                                                    className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded transition-colors"
                                                    title="Xem thành viên"
                                                >
                                                    <Users size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(dept.id)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                                    title="Xóa phòng ban"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            }) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                                        Không có phòng ban nào
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 flex justify-center">
                    <div className="flex gap-1 text-sm">
                        <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded hover:bg-slate-50 text-slate-600">1</button>
                    </div>
                </div>
            </div>

            {/* ================= MODALS ================= */}

            {/* Create Modal */}
            {showCreateModal && (
                <DeptModal
                    title="Tạo phòng ban mới"
                    onClose={() => setShowCreateModal(false)}
                    submitLabel="Tạo phòng ban"
                    submitIcon={Plus}
                    submitColor="bg-pink-600"
                />
            )}

            {/* Edit Modal */}
            {editingDept && (
                <DeptModal
                    title="Chỉnh sửa phòng ban"
                    data={editingDept}
                    onClose={() => setEditingDept(null)}
                    submitLabel="Lưu thay đổi"
                    submitIcon={Save}
                    submitColor="bg-blue-600"
                    isEdit
                />
            )}

            {/* Members View Modal */}
            {viewingMembersDept && (
                <MembersModal
                    dept={viewingMembersDept}
                    onClose={() => setViewingMembersDept(null)}
                />
            )}
        </div>
    );
};

// Reusable Modal Component since Create/Edit are very similar
const DeptModal = ({ title, data, onClose, submitLabel, submitIcon: SubmitIcon, submitColor, isEdit }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1px] animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl m-4 overflow-hidden animate-scale-in">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h5 className="text-lg font-bold text-slate-800">{title}</h5>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Tên phòng ban <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            defaultValue={data?.name}
                            className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                            placeholder="Nhập tên phòng ban"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Địa điểm (tùy chọn)</label>
                        <select defaultValue={data?.location} className="w-full border border-slate-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white">
                            <option value="">-- Không chọn tầng --</option>
                            {[1, 2, 3, 4, 5, 6, 7].map(t => <option key={t} value={`Tầng ${t}`}>Tầng {t}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Trưởng phòng</label>
                            <select defaultValue={data?.manager?.id || ""} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white">
                                <option value="">-- Chưa chọn --</option>
                                {MOCK_USERS.map(u => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                ))}
                            </select>
                            {isEdit && (
                                <small className="text-slate-400 text-xs flex items-center gap-1 mt-1">
                                    <Info size={12} /> Chỉ nhân viên trong phòng ban này
                                </small>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                {isEdit ? "Thêm nhân viên vào phòng ban" : "Thành viên phòng ban"}
                            </label>
                            <select multiple className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm h-32 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white">
                                {MOCK_USERS.map(u => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                ))}
                            </select>
                            <small className="text-slate-400 text-xs flex items-center gap-1 mt-1">
                                <UserPlus size={12} /> {isEdit ? "Nhân viên chưa có phòng ban" : "Giữ Ctrl để chọn nhiều thành viên"}
                            </small>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                        Hủy
                    </button>
                    <button className={`px-6 py-2 text-sm font-bold text-white rounded-lg hover:brightness-110 flex items-center gap-2 shadow-sm ${submitColor}`}>
                        <SubmitIcon size={18} />
                        {submitLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

const MembersModal = ({ dept, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1px] animate-fade-in">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl m-4 overflow-hidden animate-scale-in">
            <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
                <h5 className="text-white font-medium">Thành viên phòng ban: {dept.name}</h5>
                <button onClick={onClose} className="text-slate-300 hover:text-white">
                    <X size={20} />
                </button>
            </div>
            <div className="p-0 max-h-[60vh] overflow-y-auto">
                {dept.members && dept.members.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {MOCK_USERS.filter(u => dept.members.includes(u.id)).map(user => (
                            <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <img src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} className="w-10 h-10 rounded-full" alt="" />
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">{user.name}</p>
                                        <p className="text-xs text-slate-500">{user.email}</p>
                                    </div>
                                </div>
                                <button title="Xóa khỏi phòng ban" className="text-slate-300 hover:text-red-500">
                                    <X size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-slate-500">
                        Chưa có thành viên nào
                    </div>
                )}
            </div>
            <div className="p-3 border-t border-slate-100 flex justify-end bg-slate-50">
                <button onClick={onClose} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-sm font-medium">
                    Đóng
                </button>
            </div>
        </div>
    </div>
);

export default DepartmentManagement;
