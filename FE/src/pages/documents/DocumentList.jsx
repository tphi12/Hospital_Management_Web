import { useState } from "react";
import {
    Search, FileText, Eye, Download, Edit, X, File,
    CheckCircle, AlertCircle, Clock, ShieldAlert, Folder
} from "lucide-react";

/**
 * Mock Data
 */
const MOCK_DOCS = [
    {
        id: "KH_092023",
        title: "Kế hoạch khám sức khỏe định kỳ quý 3",
        creator: "Trần Văn Trọng",
        department: "Phòng Kế Hoạch",
        section: "Tổ Kế Hoạch 1",
        description: "Kế hoạch chi tiết phục vụ cán bộ nhân viên toàn viện.",
        file_path: "ke_hoach_kham_sk_q3.pdf",
        created_at: "25/08/2025",
        status: "approved",
        format: "PDF",
        keywords: "kham-suc-khoe, quy-3, ke-hoach"
    },
    {
        id: "BC_TC_2025",
        title: "Báo cáo tài chính năm 2025",
        creator: "Phạm Thị Hương",
        department: "Phòng Tài Chính",
        section: "Tổ Kế Toán",
        description: "Báo cáo tổng kết thu chi năm 2025.",
        file_path: "bao_cao_tai_chinh.xlsx",
        created_at: "10/01/2026",
        status: "pending",
        format: "Excel",
        keywords: "tai-chinh, bao-cao, nam-2025"
    },
    {
        id: "QT_01",
        title: "Quy trình tiếp nhận bệnh nhân cấp cứu",
        creator: "Nguyễn Văn A",
        department: "Khoa Cấp Cứu",
        section: "Hành chính khoa",
        description: "Quy trình chuẩn ISO về tiếp nhận bệnh nhân.",
        file_path: "quy_trinh_cc.docx",
        created_at: "15/09/2025",
        status: "rejected",
        format: "Word",
        keywords: "quy-trinh, cap-cuu, benh-nhan"
    },
    {
        id: "HD_SD_MAY",
        title: "Hướng dẫn sử dụng máy X-Quang mới",
        creator: "Lê Gia Nam",
        department: "Khoa Hình Ảnh",
        section: "Kỹ thuật",
        description: "Tài liệu trainning cho máy X-Quang KTS.",
        file_path: "hd_xquang.pdf",
        created_at: "20/01/2026",
        status: "approved",
        format: "PDF",
        keywords: "huong-dan, x-quang, may-moi"
    },
];

const DocumentList = () => {
    const [documents, setDocuments] = useState(MOCK_DOCS);
    const [searchTerm, setSearchTerm] = useState("");

    // Modals
    const [viewDoc, setViewDoc] = useState(null);
    const [editDoc, setEditDoc] = useState(null);
    const [successMsg, setSuccessMsg] = useState("");

    const filteredDocs = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.creator.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUpdate = (e) => {
        e.preventDefault();
        // Update logic mock
        setDocuments(documents.map(d => d.id === editDoc.id ? editDoc : d));
        setEditDoc(null);
        setSuccessMsg("Tài liệu đã được cập nhật thành công!");
        setTimeout(() => setSuccessMsg(""), 3000);
    };



    return (
        <div className="animate-fade-in relative">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-slate-500 mb-4">
                <span>Trang chủ</span>
                <span className="mx-2">/</span>
                <span className="font-medium text-slate-900">Danh sách tài liệu</span>
            </div>

            <div className="row">
                <div className="col-12">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 shadow-lg">
                            <h6 className="text-white font-bold mb-0">Danh sách tài liệu</h6>
                        </div>

                        <div className="p-0">
                            {/* Alert */}
                            {successMsg && (
                                <div className="absolute top-4 right-4 z-50 bg-white border-l-4 border-green-500 shadow-lg rounded-r p-4 animate-slide-in-right flex items-center gap-3">
                                    <CheckCircle className="text-green-500" size={24} />
                                    <div>
                                        <h6 className="font-bold text-slate-800">Thành công</h6>
                                        <p className="text-sm text-slate-600">{successMsg}</p>
                                    </div>
                                    <button onClick={() => setSuccessMsg("")} className="ml-4 text-slate-400 hover:text-slate-600">
                                        <X size={18} />
                                    </button>
                                </div>
                            )}

                            {/* Toolbar */}
                            <div className="p-4 border-b border-slate-100">
                                <div className="relative md:w-96">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Tìm kiếm tài liệu</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <Search size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder=""
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-pink-500 text-sm transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left align-middle">
                                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-3">Tên tài liệu</th>
                                            <th className="px-6 py-3">Người tạo</th>
                                            <th className="px-6 py-3">Phòng ban</th>
                                            <th className="px-6 py-3 text-center">Ngày tạo</th>
                                            <th className="px-6 py-3 text-center">Trạng thái</th>
                                            <th className="px-6 py-3 text-center">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredDocs.length > 0 ? filteredDocs.map((doc) => (
                                            <tr key={doc.id} className="hover:bg-slate-50 transition-colors" data-doc-id={doc.id}>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div><FileIcon path={doc.file_path} /></div>
                                                        <div>
                                                            <h6 className="text-sm font-semibold text-slate-900 mb-0">{doc.title}</h6>
                                                            <p className="text-xs text-slate-500 mb-0">{doc.file_path}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <p className="text-xs font-semibold text-slate-700 mb-0">{doc.creator}</p>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <p className="text-xs font-semibold text-slate-700 mb-0">{doc.department}</p>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <span className="text-xs font-bold text-slate-600">{doc.created_at}</span>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <StatusBadge status={doc.status} />
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => setViewDoc(doc)}
                                                            className="p-1.5 bg-cyan-50 text-cyan-500 rounded hover:bg-cyan-100 hover:scale-110 transition-all shadow-sm"
                                                            title="Xem chi tiết"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditDoc(doc)}
                                                            className="p-1.5 bg-yellow-50 text-amber-500 rounded hover:bg-yellow-100 hover:scale-110 transition-all shadow-sm"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button
                                                            className="p-1.5 bg-green-50 text-green-500 rounded hover:bg-green-100 hover:scale-110 transition-all shadow-sm"
                                                            title="Tải xuống"
                                                            onClick={() => alert("Downloading " + doc.file_path)}
                                                        >
                                                            <Download size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                                                    Không có tài liệu nào
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
                    </div>
                </div>
            </div>

            {/* View Modal */}
            {viewDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1px] animate-fade-in">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl m-4 overflow-hidden animate-scale-in">
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-4 flex items-center justify-between">
                            <h5 className="text-white font-bold flex items-center gap-2">
                                <Eye size={20} /> Chi tiết tài liệu
                            </h5>
                            <button onClick={() => setViewDoc(null)} className="text-white/80 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-y-4 gap-x-6">
                            <DetailRow label="Tên tài liệu" value={viewDoc.title} colSpan={12} />
                            <DetailRow label="Phòng ban" value={viewDoc.department} colSpan={8} />
                            <DetailRow label="Trạng thái" value={<StatusBadge status={viewDoc.status} />} colSpan={4} isComponent />
                            <DetailRow label="Tổ / Bộ phận" value={viewDoc.section} colSpan={12} />
                            <DetailRow label="Mô tả tài liệu" value={viewDoc.description} colSpan={12} />
                            <DetailRow label="Từ khóa" value={viewDoc.keywords} colSpan={12} isTag />
                            <DetailRow label="Định dạng file" value={viewDoc.format} colSpan={6} />
                            <DetailRow label="ID Tài liệu" value={viewDoc.id} colSpan={6} />
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
                            <button onClick={() => setViewDoc(null)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded hover:bg-slate-50 shadow-sm">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1px] animate-fade-in">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl m-4 overflow-hidden animate-scale-in">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 flex items-center justify-between">
                            <h5 className="text-white font-bold flex items-center gap-2">
                                <Edit size={20} /> Chỉnh sửa tài liệu
                            </h5>
                            <button onClick={() => setEditDoc(null)} className="text-white/80 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdate}>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputGroup label="Tên tài liệu" value={editDoc.title} onChange={v => setEditDoc({ ...editDoc, title: v })} colSpan={2} />
                                <InputGroup label="Phòng ban" value={editDoc.department} onChange={v => setEditDoc({ ...editDoc, department: v })} />
                                <InputGroup label="Tổ / Bộ phận" value={editDoc.section} onChange={v => setEditDoc({ ...editDoc, section: v })} />
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả tài liệu</label>
                                    <textarea
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                                        rows="3"
                                        value={editDoc.description}
                                        onChange={e => setEditDoc({ ...editDoc, description: e.target.value })}
                                    />
                                </div>
                                <InputGroup label="Từ khóa" value={editDoc.keywords} onChange={v => setEditDoc({ ...editDoc, keywords: v })} colSpan={2} />
                                <InputGroup label="Định dạng file" value={editDoc.format} readOnly />
                                <InputGroup label="ID Tài liệu" value={editDoc.id} readOnly />
                            </div>
                            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                                <button type="button" onClick={() => setEditDoc(null)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded hover:bg-slate-50 shadow-sm">
                                    Hủy
                                </button>
                                <button type="submit" className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded shadow-md hover:shadow-lg transform active:scale-[0.98] transition-all">
                                    Cập nhật
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

// Helper Components
const DetailRow = ({ label, value, colSpan = 12, isComponent, isTag }) => (
    <div className={`col-span-12 md:col-span-${colSpan} flex flex-col md:flex-row md:items-start border-b border-slate-50 pb-2`}>
        <span className="text-sm font-bold text-slate-800 w-32 shrink-0">{label}</span>
        {isComponent ? (
            <div className="mt-1 md:mt-0">{value}</div>
        ) : isTag ? (
            <div className="flex flex-wrap gap-1 mt-1 md:mt-0">
                {value.split(',').map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200">
                        {tag.trim()}
                    </span>
                ))}
            </div>
        ) : (
            <span className="text-sm text-slate-600 mt-1 md:mt-0 font-medium">{value}</span>
        )}
    </div>
);

const StatusBadge = ({ status }) => {
    if (status === 'approved') return <span className="inline-block px-3 py-1 bg-gradient-to-tr from-green-400 to-green-600 text-white text-xs font-bold rounded shadow-sm">Đã duyệt</span>;
    if (status === 'pending') return <span className="inline-block px-3 py-1 bg-gradient-to-tr from-yellow-400 to-yellow-600 text-white text-xs font-bold rounded shadow-sm">Chờ duyệt</span>;
    if (status === 'rejected') return <span className="inline-block px-3 py-1 bg-gradient-to-tr from-red-400 to-red-600 text-white text-xs font-bold rounded shadow-sm">Từ chối</span>;
    return null;
};

const FileIcon = ({ path }) => {
    if (path.endsWith('.pdf')) return <FileText size={24} className="text-red-500" />;
    if (path.endsWith('.xls') || path.endsWith('.xlsx')) return <FileText size={24} className="text-green-600" />;
    if (path.endsWith('.doc') || path.endsWith('.docx')) return <FileText size={24} className="text-blue-600" />;
    return <Folder size={24} className="text-amber-500" />;
};

const InputGroup = ({ label, value, onChange, readOnly, colSpan = 1 }) => (
    <div className={`col-span-1 md:col-span-${colSpan}`}>
        <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
        <input
            type="text"
            value={value}
            onChange={e => onChange && onChange(e.target.value)}
            readOnly={readOnly}
            className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors
                ${readOnly ? 'bg-slate-100 text-slate-500' : 'focus:border-orange-500 focus:ring-1 focus:ring-orange-500'}
            `}
        />
    </div>
);

export default DocumentList;
