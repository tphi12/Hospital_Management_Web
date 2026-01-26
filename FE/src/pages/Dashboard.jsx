import { useAuth } from "../hooks/useAuth";
import {
    Users,
    Building2,
    FileText,
    Calendar,
    FileType,
    Image as ImageIcon,
    CheckCircle,
    X
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { useState } from "react";

const Dashboard = () => {
    const { user } = useAuth();
    const [showBanner, setShowBanner] = useState(true);

    // Mock Data matching the screenshot reference
    const STATS = [
        { label: "Người Dùng", value: "16", sub: "+0 người dùng mới", icon: Users, color: "bg-slate-800" },
        { label: "Phòng Ban", value: "11", sub: "100% hoạt động", icon: Building2, color: "bg-slate-800" },
        { label: "Tài Liệu", value: "12", sub: "+0 tài liệu mới", icon: FileText, color: "bg-slate-800" },
        { label: "Lịch Trực", value: "0", sub: "0/0 đã gửi tuần này", icon: Calendar, color: "bg-slate-800" },
    ];

    const TABLE_DATA = [
        { name: "Phòng Kỹ Thuật", word: 0, excel: 1, pdf: 5, image: 0, total: 6 },
        { name: "Khoa Nội", word: 1, excel: 0, pdf: 0, image: 0, total: 2 },
        { name: "Khoa Ngoại", word: 0, excel: 0, pdf: 1, image: 0, total: 1 },
        { name: "Khoa Sản", word: 0, excel: 0, pdf: 1, image: 0, total: 1 },
        { name: "Khoa Nhi", word: 0, excel: 0, pdf: 0, image: 0, total: 0 },
        { name: "Khoa Tim mạch", word: 0, excel: 0, pdf: 0, image: 0, total: 0 },
        { name: "Khoa Răng Hàm Mặt", word: 0, excel: 0, pdf: 0, image: 0, total: 0 },
    ];

    const DOC_TYPES = [
        { name: 'WORD', count: 1, color: "text-blue-500", icon: FileText },
        { name: 'EXCEL', count: 1, color: "text-green-500", icon: FileType },
        { name: 'PDF', count: 8, color: "text-red-500", icon: FileText },
        { name: 'IMAGE', count: 0, color: "text-amber-500", icon: ImageIcon },
    ];

    const PIE_DATA = [
        { name: 'Word', value: 1, color: '#3b82f6' },
        { name: 'Excel', value: 1, color: '#22c55e' },
        { name: 'PDF', value: 8, color: '#ef4444' },
        { name: 'Image', value: 0, color: '#f59e0b' },
    ];

    // Prepare Bar Chart Data
    const BAR_DATA = TABLE_DATA.map(item => ({
        name: item.name,
        docs: item.total
    })).filter(item => item.docs >= 0).slice(0, 8);

    return (
        <div className="space-y-6 animate-fade-in">

            {/* 1. Header Section */}
            <div>
                <div className="flex items-center text-sm text-slate-500 mb-1">
                    <span>Trang chủ</span>
                    <span className="mx-2">/</span>
                    <span className="font-medium text-slate-900">Tổng quan</span>
                </div>

                {/* Success Banner */}
                {showBanner && (
                    <div className="bg-green-500 text-white p-4 rounded-lg flex items-center justify-between shadow-sm mt-4">
                        <div className="flex items-center gap-2">
                            <CheckCircle size={20} />
                            <span className="font-medium">Thành công! Đăng nhập thành công! Chào mừng {user.role === 'ADMIN' ? 'Quản trị viên' : user.name}</span>
                        </div>
                        <button onClick={() => setShowBanner(false)} className="hover:bg-white/20 p-1 rounded transition">
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* Title */}
                <div className="mt-6">
                    <h1 className="text-3xl font-extrabold text-slate-900">Tổng quan</h1>
                    <p className="text-slate-500 mt-1">Thống kê tổng quan hệ thống quản lý tài liệu bệnh viện.</p>
                </div>
            </div>

            {/* 2. Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {STATS.map((stat, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                            <h3 className="text-3xl font-bold text-slate-900 mb-2">{stat.value}</h3>
                            <p className={`text-xs font-semibold ${stat.sub.includes('+') || stat.sub.includes('100%') ? 'text-green-600' : 'text-slate-400'}`}>
                                {stat.sub}
                            </p>
                        </div>
                        <div className={`${stat.color} text-white p-3 rounded-lg`}>
                            <stat.icon size={20} />
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. Document Summary Bar */}
            <div className="bg-slate-100 rounded-xl p-8 flex flex-wrap items-center justify-around gap-8">
                {DOC_TYPES.map((type, idx) => (
                    <div key={idx} className="text-center">
                        <div className="flex flex-col items-center gap-1">
                            <type.icon className={`${type.color} mb-1`} size={24} />
                            <span className="text-xs font-bold text-slate-500 tracking-wider">{type.name}</span>
                            <span className={`text-2xl font-bold ${type.color}`}>{type.count}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* 4. Detailed Data Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900">Thống kê Tài liệu theo Phòng ban và Định dạng</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white text-slate-400 font-semibold uppercase text-xs border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Phòng Ban</th>
                                <th className="px-6 py-4 text-center">Word</th>
                                <th className="px-6 py-4 text-center">Excel</th>
                                <th className="px-6 py-4 text-center">PDF</th>
                                <th className="px-6 py-4 text-center">Image</th>
                                <th className="px-6 py-4 text-center">Tổng</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {TABLE_DATA.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-700">{row.name}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-block px-3 py-1 bg-slate-100 rounded-md font-bold text-slate-600 min-w-[2rem]">{row.word}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-block px-3 py-1 bg-slate-100 rounded-md font-bold text-slate-600 min-w-[2rem]">{row.excel}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-block px-3 py-1 bg-slate-100 rounded-md font-bold text-slate-600 min-w-[2rem]">{row.pdf}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-block px-3 py-1 bg-slate-100 rounded-md font-bold text-slate-600 min-w-[2rem]">{row.image}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center text-slate-400 font-medium">
                                        {row.total}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 5. Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Thống kê số lượng tài liệu theo Phòng ban</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={BAR_DATA}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="name"
                                    angle={-25}
                                    textAnchor="end"
                                    interval={0}
                                    height={80}
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="docs" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Tỷ lệ tài liệu theo Định dạng</h3>
                    <div className="h-80 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={PIE_DATA}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={0}
                                    outerRadius={120}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {PIE_DATA.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="rect" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
