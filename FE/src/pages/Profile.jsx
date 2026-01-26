import { useState, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import {
    User, Mail, Phone, MapPin, Calendar, Briefcase, Shield,
    Camera, Edit2, Save, X, CheckCircle, Lock, Building2
} from "lucide-react";

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email || "chua_co@gmail.com",
        phone: user.phone || "0912345678",
        address: user.address || "Hà Nội, Việt Nam",
        dob: user.dob || "1990-01-01",
        bio: user.bio || "Nhân viên gương mẫu, tận tâm với công việc."
    });
    const [avatar, setAvatar] = useState(user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`);
    const fileInputRef = useRef(null);

    // Handlers
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        // Update global user context
        updateUser({
            ...formData,
            avatar: avatar // persist avatar too if changed
        });
        setIsEditing(false);
        // Simulate toast/notification
        alert("Cập nhật thông tin thành công!");
    };

    const handleAvatarClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setAvatar(imageUrl);
            // Auto update avatar on selection or wait for save?
            // Let's wait for save for user info, but maybe update visual immediately.
            // For now, we included avatar in handleSave logic.
        }
    };

    return (
        <div className="animate-fade-in pb-10">
            {/* Header / Cover Area */}
            <div className="relative h-60 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-b-[3rem] shadow-lg mb-20">
                <div className="absolute inset-0 bg-black/10 rounded-b-[3rem]"></div>

                {/* Profile Card Overlay */}
                <div className="absolute -bottom-16 left-0 right-0 px-4 flex justify-center">
                    <div className="relative">
                        {/* Avatar */}
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white group cursor-pointer" onClick={handleAvatarClick}>
                            <img src={avatar} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white" size={32} />
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleFileChange}
                        />

                        {/* Role Badge */}
                        <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-md border-2 border-white">
                            {user.role}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-slate-800 mb-1">{formData.name}</h1>
                    <p className="text-slate-500 font-medium flex items-center justify-center gap-2">
                        <Building2 size={16} /> {user.department || "Khoa Nội"} - {user.position || "Nhân viên"}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Quick Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Shield size={20} className="text-blue-500" /> Thông tin tài khoản
                            </h3>
                            <div className="space-y-4">
                                <InfoItem label="ID nhân viên" value={user.id || "EMP-001"} />
                                <InfoItem label="Username" value={user.username || "admin"} />
                                <InfoItem label="Ngày tham gia" value="20/05/2023" />
                                <InfoItem label="Trạng thái" value="Đang hoạt động" isSuccess />
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-100">
                                <button className="w-full py-2 bg-slate-50 text-slate-600 font-medium rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                                    <Lock size={16} /> Đổi mật khẩu
                                </button>
                            </div>
                        </div>

                        {/* Stats or Bio */}
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-lg p-6 text-white">
                            <h3 className="font-bold mb-3 opacity-90">Giới thiệu</h3>
                            <p className="text-sm text-slate-300 leading-relaxed italic">
                                "{formData.bio}"
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Editable Details */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <User size={20} className="text-pink-500" /> Thông tin cá nhân
                                </h3>
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm flex items-center gap-2"
                                    >
                                        <Edit2 size={16} /> Chỉnh sửa
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md flex items-center gap-2"
                                        >
                                            <Save size={16} /> Lưu thay đổi
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="p-8">
                                <form className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <FormGroup
                                        label="Họ và tên"
                                        icon={User}
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        colSpan={2}
                                    />
                                    <FormGroup
                                        label="Email"
                                        icon={Mail}
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                    />
                                    <FormGroup
                                        label="Số điện thoại"
                                        icon={Phone}
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                    />
                                    <FormGroup
                                        label="Địa chỉ"
                                        icon={MapPin}
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        colSpan={2}
                                    />
                                    <FormGroup
                                        label="Ngày sinh"
                                        icon={Calendar}
                                        name="dob"
                                        type="date"
                                        value={formData.dob}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                    />
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Tiểu sử ngắn</label>
                                        <textarea
                                            disabled={!isEditing}
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleChange}
                                            rows="3"
                                            className={`w-full border rounded-lg px-4 py-3 text-sm transition-all outline-none resize-none
                                                ${!isEditing
                                                    ? "bg-slate-50 border-slate-200 text-slate-500"
                                                    : "bg-white border-slate-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                                }`}
                                        />
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper Components
const InfoItem = ({ label, value, isSuccess }) => (
    <div className="flex justify-between items-center text-sm border-b border-dashed border-slate-100 pb-2 last:border-0 last:pb-0">
        <span className="text-slate-500">{label}</span>
        <span className={`font-semibold ${isSuccess ? "text-green-600 flex items-center gap-1" : "text-slate-800"}`}>
            {isSuccess && <CheckCircle size={14} />}
            {value}
        </span>
    </div>
);

const FormGroup = ({ label, icon: Icon, type = "text", value, onChange, disabled, colSpan = 1, name }) => (
    <div className={`col-span-1 md:col-span-${colSpan}`}>
        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Icon size={16} className="text-slate-400" /> {label}
        </label>
        <div className="relative">
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`w-full border rounded-lg px-4 py-2.5 text-sm transition-all outline-none
                    ${disabled
                        ? "bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed"
                        : "bg-white border-slate-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                    }
                `}
            />
        </div>
    </div>
);

export default Profile;
