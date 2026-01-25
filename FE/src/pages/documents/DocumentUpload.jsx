import { useState, useRef } from "react";
import { CloudUpload, FileText, X, CheckCircle, AlertCircle, Info } from "lucide-react";

/**
 * Mock Data
 */
const CATEGORIES = [
    { id: 1, name: "Hành chính" },
    { id: 2, name: "Chuyên môn" },
    { id: 3, name: "Đào tạo" },
    { id: 4, name: "Quy trình" },
];

const DEPARTMENTS = [
    { id: 1, name: "Khoa Nội" },
    { id: 2, name: "Khoa Ngoại" },
    { id: 3, name: "Khoa Sản" },
    { id: 4, name: "Phòng Tài Chính Kế Toán" },
    { id: 5, name: "Phòng Kỹ Thuật" },
];

const DocumentUpload = () => {
    const [formData, setFormData] = useState({
        title: "",
        categoryId: "",
        deptId: "",
        description: ""
    });
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const fileInputRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (selectedFile) => {
        // Validate file type and size (simple check)
        if (selectedFile.size > 50 * 1024 * 1024) {
            setErrorMsg("File quá lớn (Tối đa 50MB)");
            return;
        }
        setFile(selectedFile);
        setErrorMsg("");
    };

    const removeFile = (e) => {
        e.stopPropagation();
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title || !formData.categoryId || !file) {
            setErrorMsg("Vui lòng điền đầy đủ thông tin và chọn file.");
            return;
        }

        // Mock Upload API Call
        console.log("Uploading...", { ...formData, file });

        // Simulate Success
        setSuccessMsg("Upload tài liệu thành công!");
        setFormData({ title: "", categoryId: "", deptId: "", description: "" });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";

        // Auto clear success message
        setTimeout(() => setSuccessMsg(""), 5000);
    };

    return (
        <div className="animate-fade-in">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-slate-500 mb-4">
                <span>Trang chủ</span>
                <span className="mx-2">/</span>
                <span className="font-medium text-slate-900">Upload Tài liệu</span>
            </div>

            <div className="row">
                <div className="col-12">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 shadow-lg">
                            <h6 className="text-white font-bold mb-0">Upload Tài liệu</h6>
                        </div>

                        <div className="p-6">

                            {/* Alerts */}
                            {successMsg && (
                                <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2 mb-4 animate-scale-in">
                                    <CheckCircle size={20} />
                                    <strong>Thành công!</strong> {successMsg}
                                </div>
                            )}
                            {errorMsg && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 mb-4 animate-scale-in">
                                    <AlertCircle size={20} />
                                    <strong>Lỗi!</strong> {errorMsg}
                                </div>
                            )}

                            <h6 className="text-slate-900 font-bold mb-4">Upload tài liệu mới</h6>

                            <form onSubmit={handleSubmit}>
                                {/* Title */}
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        Tên tài liệu <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-colors"
                                        placeholder="Nhập tên tài liệu"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    {/* Category */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                                            Danh mục <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="categoryId"
                                            value={formData.categoryId}
                                            onChange={handleChange}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-white"
                                            required
                                        >
                                            <option value="">-- Chọn danh mục --</option>
                                            {CATEGORIES.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Department */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                                            Phòng ban
                                        </label>
                                        <select
                                            name="deptId"
                                            value={formData.deptId}
                                            onChange={handleChange}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-white"
                                        >
                                            <option value="">-- Chọn phòng ban (tùy chọn) --</option>
                                            {DEPARTMENTS.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        Mô tả tài liệu
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows="3"
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-colors"
                                        placeholder="Nhập mô tả ngắn gọn về nội dung tài liệu (tùy chọn)"
                                    />
                                </div>

                                {/* Drag & Drop Area */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        Chọn file tải lên <span className="text-red-500">*</span>
                                    </label>

                                    <div
                                        className={`border-2 border-dashed rounded-lg p-10 text-center transition-all cursor-pointer bg-slate-50
                      ${dragActive ? 'border-pink-500 bg-pink-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-100'}
                    `}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        <div className="flex flex-col items-center justify-center text-slate-500">
                                            <CloudUpload size={48} className="mb-4 text-slate-400" />
                                            <p className="font-medium text-lg text-slate-700 mb-1">Kéo & thả file vào đây hoặc click để chọn</p>
                                            <span className="text-xs text-slate-400">Định dạng: PDF, Word, Excel, JPG, PNG. Tối đa 50MB</span>
                                        </div>
                                    </div>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileChange}
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                    />

                                    {/* File List / Preview */}
                                    <div className="mt-4 min-h-[40px]">
                                        {file ? (
                                            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-md border border-blue-100 animate-scale-in">
                                                <FileText size={18} />
                                                <span className="text-sm font-medium">{file.name}</span>
                                                <span className="text-xs opacity-70">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                                <button
                                                    type="button"
                                                    onClick={removeFile}
                                                    className="ml-2 p-1 text-blue-400 hover:text-red-500 transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-400 italic">Chưa có file nào được chọn</div>
                                        )}
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="text-right">
                                    <button
                                        type="submit"
                                        className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-2.5 px-8 rounded-lg shadow-md hover:shadow-lg transform active:scale-[0.98] transition-all uppercase text-xs tracking-wider"
                                    >
                                        Upload Tài Liệu
                                    </button>
                                </div>

                            </form>

                            <hr className="my-8 border-slate-100" />

                            {/* Info Box */}
                            <div className="bg-slate-800 text-white rounded-lg p-4">
                                <h6 className="font-bold flex items-center gap-2 text-white mb-2">
                                    <Info size={18} />
                                    Hướng dẫn Upload Tài liệu
                                </h6>
                                <ul className="text-sm space-y-1 text-slate-300 list-disc pl-5">
                                    <li><strong>Cấu trúc lưu trữ:</strong> F:/[Phòng ban]/[Tổ]/[Tên file]</li>
                                    <li><strong>ID Tài liệu:</strong> Tự động tạo theo format [Mã PB]_[GiờPhútGiâyNgàyThángNăm]</li>
                                    <li><strong>Quyền sửa/xóa:</strong> Chỉ người tạo tài liệu</li>
                                    <li><strong>Quyền xem:</strong> Tất cả nhân viên trong hệ thống</li>
                                </ul>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentUpload;
