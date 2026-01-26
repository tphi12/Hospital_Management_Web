import { useState } from "react";
import { Search, Plus, Filter, MoreHorizontal, Lock, Trash2, Edit, X, Save, CheckCircle, AlertCircle } from "lucide-react";
import { ROLES } from "../../lib/roles";

/**
 * Mock Data
 */
const INITIAL_USERS = [
    {
        id: 1,
        name: "Trần Văn Trọng",
        username: "trongtran",
        email: "trong14122003@gmail.com",
        avatar: "https://ui-avatars.com/api/?name=TV&background=random",
        dept: "Chưa có phòng ban",
        dept_id: "",
        position: "Nhân viên",
        roles: [],
        active: true,
        status: "ĐANG HOẠT ĐỘNG",
        phone: "0987654321"
    },
    {
        id: 2,
        name: "Trọng Trần",
        username: "trongtran_bs",
        email: "trong123@gmail.com",
        avatar: "https://ui-avatars.com/api/?name=TT&background=random",
        dept: "Khoa Sản",
        dept_id: "khoa-san",
        position: "Nhân viên",
        roles: ["BÁC SĨ"],
        active: false,
        status: "ĐÃ KHÓA",
        phone: "0123456789"
    },
    {
        id: 3,
        name: "Lê Gia Nam",
        username: "legianam",
        email: "lenamhtkhus@gmail.com",
        avatar: "https://ui-avatars.com/api/?name=LN&background=random",
        dept: "Khoa Hình ảnh",
        dept_id: "khoa-hinh-anh",
        position: "Nhân viên",
        roles: ["ADMIN"],
        active: true,
        status: "ĐANG HOẠT ĐỘNG",
        phone: "0999888777"
    },
];

const DEPARTMENTS = [
    { id: "khoa-noi", name: "Khoa Nội" },
    { id: "khoa-ngoai", name: "Khoa Ngoại" },
    { id: "khoa-san", name: "Khoa Sản" },
    { id: "khoa-hinh-anh", name: "Khoa Hình ảnh" },
    { id: "phong-ky-thuat", name: "Phòng Kỹ Thuật" },
];

const ROLE_OPTIONS = [
    { id: "ADMIN", name: "Admin" },
    { id: "BÁC SĨ", name: "Bác sĩ" },
    { id: "KẾ TOÁN", name: "Kế toán" },
    { id: "HOSPITAL_CLERK", name: "Văn thư" },
    { id: "HEAD_OF_DEPT", name: "Trưởng phòng" },
];

const UserManagement = () => {
    const [users, setUsers] = useState(INITIAL_USERS);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // Search State
    const [searchTerm, setSearchTerm] = useState("");



    const handleSearch = (e) => setSearchTerm(e.target.value.toLowerCase());

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
    );

    const handleDelete = (id) => {
        if (window.confirm("Bạn có chắc muốn xóa mềm tài khoản này? Nó sẽ bị ẩn khỏi danh sách.")) {
            setUsers(users.filter(u => u.id !== id));
        }
    };

    const handleToggleStatus = (id) => {
        setUsers(users.map(u => {
            if (u.id === id) {
                const newActive = !u.active;
                return { ...u, active: newActive, status: newActive ? "ĐANG HOẠT ĐỘNG" : "ĐÃ KHÓA" };
            }
            return u;
        }));
    };

    const openEditModal = (user) => {
        setCurrentUser(user);
        setShowEditModal(true);
    };

    return (
        <div className="animate-fade-in relative">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-slate-500 mb-4">
                <span>Trang chủ</span>
                <span className="mx-2">/</span>
                <span className="font-medium text-slate-900">Người dùng</span>
            </div>

            {/* Main Card */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">

                {/* Header Banner - Dark */}
                <div className="bg-slate-900 text-white p-4">
                    <h2 className="text-lg font-medium">Danh sách người dùng</h2>
                </div>

                {/* Toolbar */}
                <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-100">
                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm người dùng"
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 text-sm transition-colors"
                        />
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        Thêm tài khoản
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left align-middle">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3">Người dùng</th>
                                <th className="px-6 py-3">Phòng ban / Chức vụ</th>
                                <th className="px-6 py-3 text-center">Vai trò hệ thống</th>
                                <th className="px-6 py-3 text-center">Kích hoạt</th>
                                <th className="px-6 py-3 text-center">Trạng thái</th>
                                <th className="px-6 py-3 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <img src={user.avatar} alt="" className="w-9 h-9 rounded-lg object-cover border border-slate-200" />
                                            <div>
                                                <p className="font-semibold text-slate-900 text-sm">{user.name}</p>
                                                <p className="text-slate-500 text-xs">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div>
                                            <p className="font-semibold text-slate-700 text-xs">{user.dept}</p>
                                            <p className="text-slate-500 text-xs">{user.position}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        {user.roles.length > 0 ? user.roles.map((role, idx) => (
                                            <span key={idx} className="inline-block px-2 py-1 bg-slate-500 text-white text-[10px] font-bold rounded mx-0.5">
                                                {role}
                                            </span>
                                        )) : (
                                            <span className="inline-block px-2 py-1 bg-slate-300 text-white text-[10px] font-bold rounded">
                                                CHƯA CÓ
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <div className="flex justify-center">
                                            <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${user.active ? 'bg-green-500' : 'bg-slate-300'}`}>
                                                <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${user.active ? 'translate-x-5' : ''}`}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <span className={`inline-block px-3 py-1 text-[10px] font-bold rounded-sm tracking-wide text-white min-w-[90px]
                                    ${user.active ? 'bg-green-500' : 'bg-red-500'}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="px-2 py-1 bg-slate-800 text-white text-xs font-medium rounded hover:bg-slate-900 transition-colors"
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(user.id)}
                                                className="px-2 py-1 border border-slate-300 text-slate-700 text-xs font-medium rounded hover:bg-slate-50 transition-colors min-w-[60px]"
                                            >
                                                {user.active ? 'Khóa' : 'Mở khóa'}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 transition-colors"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colspan="6" className="px-6 py-8 text-center text-slate-500">
                                        Không có người dùng nào
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Info */}
                <div className="p-4 border-t border-slate-100 flex justify-center">
                    <div className="flex gap-1 text-sm">
                        <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded hover:bg-slate-50 text-slate-600">1</button>
                    </div>
                </div>
            </div>

            {/* =========================================
          MODALS
      ========================================= */}

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1px] transition-opacity">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl m-4 overflow-hidden animate-scale-in">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800">Tạo tài khoản người dùng mới</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField label="Họ và tên" required placeholder="Nhập họ tên" />
                                <InputField label="Username" required placeholder="Nhập tên đăng nhập" />
                                <InputField label="Email" required type="email" placeholder="example@gmail.com" />
                                <InputField label="Số điện thoại" placeholder="09xxx..." />
                                <div className="md:col-span-1">
                                    <InputField label="Mật khẩu" required type="password" />
                                    <p className="text-xs text-slate-400 mt-1">Tối thiểu 8 ký tự</p>
                                </div>
                                <InputField label="Xác nhận mật khẩu" required type="password" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Phòng ban</label>
                                    <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500">
                                        <option value="">-- Chọn phòng ban --</option>
                                        {DEPARTMENTS.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Vai trò hệ thống</label>
                                    <select multiple className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm h-32 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500">
                                        {ROLE_OPTIONS.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-slate-400 mt-1">Giữ Ctrl để chọn nhiều vai trò</p>
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500" defaultChecked />
                                    <span className="text-sm text-slate-700">Kích hoạt tài khoản ngay</span>
                                </label>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                            >
                                Hủy
                            </button>
                            <button className="px-4 py-2 text-sm font-bold text-white bg-pink-500 rounded-lg hover:bg-pink-600 flex items-center gap-2">
                                <Plus size={16} />
                                Tạo tài khoản
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && currentUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1px] transition-opacity">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl m-4 overflow-hidden animate-scale-in">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800">Chỉnh sửa thông tin người dùng</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField label="Họ và tên" required defaultValue={currentUser.name} />
                                <InputField label="Username" required defaultValue={currentUser.username} />
                                <InputField label="Email" required type="email" defaultValue={currentUser.email} />
                                <InputField label="Số điện thoại" defaultValue={currentUser.phone} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                                <div className="md:col-span-1">
                                    <InputField label="Mật khẩu mới" type="password" />
                                    <p className="text-xs text-slate-400 mt-1">Để trống nếu không đổi mật khẩu</p>
                                </div>
                                <InputField label="Xác nhận mật khẩu mới" type="password" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Phòng ban</label>
                                    <select defaultValue={currentUser.dept_id} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500">
                                        <option value="">-- Chọn phòng ban --</option>
                                        {DEPARTMENTS.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Vai trò hệ thống</label>
                                    <select multiple className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm h-32 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500">
                                        {ROLE_OPTIONS.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-slate-400 mt-1">Giữ Ctrl để chọn nhiều vai trò</p>
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500" defaultChecked={currentUser.active} />
                                    <span className="text-sm text-slate-700">Kích hoạt tài khoản</span>
                                </label>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                            >
                                Hủy
                            </button>
                            <button className="px-4 py-2 text-sm font-bold text-white bg-pink-500 rounded-lg hover:bg-pink-600 flex items-center gap-2">
                                <Save size={16} />
                                Cập nhật
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

// Helper Component for inputs
const InputField = ({ label, required, type = "text", placeholder, defaultValue }) => (
    <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            placeholder={placeholder}
            defaultValue={defaultValue}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all placeholder:text-slate-400"
        />
    </div>
);

export default UserManagement;
