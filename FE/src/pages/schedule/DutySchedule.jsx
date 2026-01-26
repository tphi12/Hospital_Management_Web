import { Calendar, Download, Send, CheckCircle, Printer, Save, Edit } from "lucide-react";

/**
 * MOCK DATA
 */
const DUTY_DATA = [
    {
        day: "Thứ 2", date: "04/08",
        leader: "BS Tân",
        doctors: { general: "BS Thủy", obs: "BS Xuân", cdha: "BS Trang", hscc: "BS Tâm", internal: "BS Hòa" },
        nurses: { lck: "ĐD Tâm", surgery: "ĐD Huyền", obs: "ĐD Trang", lab: "KTV Huyên", cdha: "KTV Tuấn" },
        others: { cashier: "Yến" }
    },
    {
        day: "Thứ 3", date: "05/08",
        leader: "BS Huy",
        doctors: { general: "BS Dân", obs: "BS Lệ", cdha: "BS Hoàng", hscc: "BS Việt", internal: "BS Lê" },
        nurses: { lck: "ĐD Bé", surgery: "ĐD Hoài", obs: "ĐD Hiếu", lab: "KTV Phi", cdha: "KTV Tiến" },
        others: { cashier: "Tuyết" }
    },
    {
        day: "Thứ 4", date: "06/08",
        leader: "BS Tân",
        doctors: { general: "BS Tuấn", obs: "BS Hải", cdha: "BS Trang", hscc: "BS Tuyên", internal: "BS Liên" },
        nurses: { lck: "ĐD Thiện", surgery: "ĐD Đào", obs: "ĐD Ly", lab: "KTV Trang", cdha: "KTV Huy" },
        others: { cashier: "Hiền" }
    },
    {
        day: "Thứ 5", date: "07/08",
        leader: "BS Huy",
        doctors: { general: "BS Thiện", obs: "BS Khôi", cdha: "BS Linh", hscc: "BS Thủy", internal: "BS Huệ" },
        nurses: { lck: "ĐD Hằng", surgery: "ĐD Huyền", obs: "ĐD Trang", lab: "KTV Hiếu", cdha: "KTV Quỳnh" },
        others: { cashier: "Yến" }
    },
    {
        day: "Thứ 6", date: "08/08",
        leader: "BS Tân",
        doctors: { general: "BS Tuấn", obs: "BS Nhung", cdha: "BS Mạnh", hscc: "BS Tuyên", internal: "BS Hòa" },
        nurses: { lck: "ĐD N.Anh", surgery: "ĐD Hằng", obs: "ĐD Hiếu", lab: "KTV Trang", cdha: "KTV Tuấn" },
        others: { cashier: "Tuyết" }
    },
    {
        day: "Thứ 7", date: "09/08",
        leader: "BS Huy",
        doctors: { general: "BS Thủy", obs: "BS Luật", cdha: "BS Mạnh", hscc: "BS Việt", internal: "BS Lê" },
        nurses: { lck: "ĐD Tâm", surgery: "ĐD Đào", obs: "ĐD Ly", lab: "KTV Huyên", cdha: "KTV Tiến" },
        others: { cashier: "Hiền" }
    },
    {
        day: "CN", date: "10/08",
        leader: "BS Dân",
        doctors: { general: "BS Dân", obs: "BS Lệ", cdha: "BS Linh", hscc: "BS Tuyên", internal: "BS Liên" },
        nurses: { lck: "ĐD Bé", surgery: "ĐD Huyền", obs: "ĐD Trang", lab: "KTV Phi", cdha: "KTV Huy" },
        others: { cashier: "Dân" }
    },
];

const DutySchedule = ({ role = "VIEWER" }) => {
    // const [status, setStatus] = useState("PUBLISHED"); // DRAFT | PENDING | PUBLISHED

    return (
        <div className="animate-fade-in bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #printable-area, #printable-area * {
                            visibility: visible;
                        }
                        #printable-area {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            background: white;
                            padding: 20px;
                        }
                        .no-print {
                            display: none !important;
                        }
                        /* Ensure table borders are sharp for print */
                        table { border-collapse: collapse !important; width: 100%; }
                        th, td { border: 1px solid #000 !important; color: #000 !important; }
                        /* Hide shadown/borders of container */
                        .shadow-sm { box-shadow: none !important; border: none !important; }
                    }
                `}
            </style>

            {/* Header */}
            <div id="printable-area">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 uppercase">Lịch Trực Bệnh Viện</h1>
                        <p className="text-slate-500 text-sm mt-1">Từ ngày 04/08/2025 đến ngày 10/08/2025</p>
                    </div>
                    <div className="flex gap-2 no-print">
                        {/* Role Based Actions */}
                        {role === "CLERK" && (
                            <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors">
                                <Send size={18} /> Gửi lịch
                            </button>
                        )}
                        {(role === "ADMIN" || role === "KHTH") && (
                            <button className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 font-medium transition-colors">
                                <CheckCircle size={18} /> Duyệt & Public
                            </button>
                        )}
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                        >
                            <Printer size={18} /> In / Xuất PDF
                        </button>
                    </div>
                </div>

                {/* Complex Table Container */}
                <div className="overflow-x-auto p-4">
                    <table className="w-full border-collapse border border-slate-300 text-xs md:text-sm">
                        <thead>
                            {/* Top Header Row */}
                            <tr className="bg-slate-100 text-slate-800 font-bold uppercase text-center">
                                <th className="border border-slate-300 p-2 w-10" rowSpan={2}>Thứ</th>
                                <th className="border border-slate-300 p-2 w-10" rowSpan={2}>Ngày</th>
                                <th className="border border-slate-300 p-2" rowSpan={2}>Trực Lãnh Đạo</th>
                                <th className="border border-slate-300 p-2" colSpan={5}>Bác Sĩ</th>
                                <th className="border border-slate-300 p-2" colSpan={5}>Điều Dưỡng - KTV - NHS</th>
                                <th className="border border-slate-300 p-2" rowSpan={2}>Thu ngân</th>
                            </tr>
                            {/* Sub Header Row */}
                            <tr className="bg-slate-50 text-slate-700 font-semibold text-center text-[10px] md:text-xs">
                                {/* Doctors */}
                                <th className="border border-slate-300 p-1">Toàn viện</th>
                                <th className="border border-slate-300 p-1">Sản</th>
                                <th className="border border-slate-300 p-1">CĐHA</th>
                                <th className="border border-slate-300 p-1">HSCC</th>
                                <th className="border border-slate-300 p-1">Nội</th>
                                {/* Nurses */}
                                <th className="border border-slate-300 p-1">LCK</th>
                                <th className="border border-slate-300 p-1">Ngoại</th>
                                <th className="border border-slate-300 p-1">Sản</th>
                                <th className="border border-slate-300 p-1">Xét nghiệm</th>
                                <th className="border border-slate-300 p-1">CĐHA</th>
                            </tr>
                        </thead>
                        <tbody>
                            {DUTY_DATA.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 text-center text-slate-800 transition-colors">
                                    <td className="border border-slate-300 p-2 font-bold bg-slate-50">{row.day}</td>
                                    <td className="border border-slate-300 p-2 font-bold">{row.date}</td>
                                    <td className="border border-slate-300 p-2 font-bold text-red-600">{row.leader}</td>

                                    {/* Doctors */}
                                    <td className="border border-slate-300 p-2">{row.doctors.general}</td>
                                    <td className="border border-slate-300 p-2">{row.doctors.obs}</td>
                                    <td className="border border-slate-300 p-2">{row.doctors.cdha}</td>
                                    <td className="border border-slate-300 p-2">{row.doctors.hscc}</td>
                                    <td className="border border-slate-300 p-2">{row.doctors.internal}</td>

                                    {/* Nurses */}
                                    <td className="border border-slate-300 p-2">{row.nurses.lck}</td>
                                    <td className="border border-slate-300 p-2">{row.nurses.surgery}</td>
                                    <td className="border border-slate-300 p-2">{row.nurses.obs}</td>
                                    <td className="border border-slate-300 p-2">{row.nurses.lab}</td>
                                    <td className="border border-slate-300 p-2">{row.nurses.cdha}</td>

                                    <td className="border border-slate-300 p-2">{row.others.cashier}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Notes */}
                <div className="p-4 bg-slate-50 border-t border-slate-200">
                    <div className="flex flex-col md:flex-row justify-between text-sm text-slate-600 gap-4">
                        <div>
                            <p><strong>Lưu ý:</strong></p>
                            <ul className="list-disc pl-5 mt-1 space-y-1">
                                <li>Khi cần gọi xe cấp cứu: Gọi theo số điện thoại đội xe <strong>0989.920.789</strong></li>
                                <li>Trực bảo vệ: Ca 1 - Ông Trần Hữu Phùng (0369742988)</li>
                            </ul>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-red-600 uppercase">Trực Lãnh Đạo</p>
                            <p className="mt-8 font-bold">Thái Khắc Huy</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DutySchedule;
