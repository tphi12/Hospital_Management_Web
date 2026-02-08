import { useState } from "react";
import { Calendar, Printer, Edit, Save, Plus } from "lucide-react";

import { INITIAL_WEEKLY_DATA } from "../../lib/mockScheduleData";

/**
 * MOCK DATA
 */
// INITIAL_WEEKLY_DATA imported from shared lib

const WeeklySchedule = ({ role = "VIEWER" }) => {
    const [data, setData] = useState(INITIAL_WEEKLY_DATA);
    const [isEditing, setIsEditing] = useState(false);

    const handleCellChange = (index, field, value) => {
        const newData = [...data];
        newData[index][field] = value;
        setData(newData);
    };

    const handleSave = () => {
        setIsEditing(false);
        alert("Đã lưu lịch công tác tuần!");
    };

    return (
        <div className="animate-fade-in bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #printable-area-weekly, #printable-area-weekly * {
                            visibility: visible;
                        }
                        #printable-area-weekly {
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
            <div id="printable-area-weekly">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="text-center md:text-left w-full">
                        <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">Công Tác Tuần</h1>
                        <p className="text-slate-500 font-medium mt-1">Tuần 32 - Từ ngày 04/08/2025 đến ngày 10/08/2025</p>
                    </div>
                    <div className="flex gap-2 shrink-0 no-print">
                        {(role === "ADMIN" || role === "KHTH") && (
                            !isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors"
                                >
                                    <Edit size={18} /> Chỉnh sửa
                                </button>
                            ) : (
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 font-medium transition-colors"
                                >
                                    <Save size={18} /> Lưu thay đổi
                                </button>
                            )
                        )}
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                        >
                            <Printer size={18} /> In PDF
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto p-4">
                    <table className="w-full border-collapse border border-slate-900 text-sm">
                        <thead>
                            <tr className="bg-white text-slate-900 font-bold uppercase text-center">
                                <th className="border border-slate-900 p-3 w-16">Thứ</th>
                                <th className="border border-slate-900 p-3 w-16">Ngày</th>
                                <th className="border border-slate-900 p-3 w-1/2">Sáng</th>
                                <th className="border border-slate-900 p-3 w-1/2">Chiều</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, idx) => (
                                <tr key={idx} className="bg-white text-slate-800">
                                    <td className="border border-slate-900 p-3 font-bold text-center align-middle bg-slate-50">
                                        <div className="text-lg">{row.day}</div>
                                    </td>
                                    <td className="border border-slate-900 p-3 font-bold text-center align-middle">
                                        {row.date}
                                    </td>

                                    {/* Morning Cell */}
                                    <td className="border border-slate-900 p-3 align-top h-24">
                                        {isEditing ? (
                                            <textarea
                                                value={row.morning}
                                                onChange={(e) => handleCellChange(idx, 'morning', e.target.value)}
                                                className="w-full h-full p-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500 resize-none"
                                            />
                                        ) : (
                                            <p className="whitespace-pre-wrap leading-relaxed">{row.morning}</p>
                                        )}
                                    </td>

                                    {/* Afternoon Cell */}
                                    <td className="border border-slate-900 p-3 align-top h-24">
                                        {isEditing ? (
                                            <textarea
                                                value={row.afternoon}
                                                onChange={(e) => handleCellChange(idx, 'afternoon', e.target.value)}
                                                className="w-full h-full p-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500 resize-none"
                                            />
                                        ) : (
                                            <p className="whitespace-pre-wrap leading-relaxed">{row.afternoon}</p>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Signatures */}
                <div className="p-8 bg-white mt-4">
                    <div className="flex justify-end gap-16">
                        <div className="text-center">
                            <p className="font-bold text-slate-900 uppercase mb-16">Giám Đốc</p>
                            <p className="font-bold text-slate-900">Thái Khắc Huy</p>
                        </div>
                    </div>
                </div>
            </div> {/* End of printable-area-weekly */}
        </div>
    );
};

export default WeeklySchedule;
