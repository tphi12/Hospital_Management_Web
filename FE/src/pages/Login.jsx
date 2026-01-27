import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ROLES } from "../lib/roles";
import { User, Lock, Eye, EyeOff, Building2, ChevronRight } from "lucide-react";
import hospitalBanner from "../assets/hospital-banner.jpg";
import hospitalHallway from "../assets/hospital-hallway.jpg";
import medicalPattern from "../assets/medical-pattern.jpg";
import hospitalLogoLarge from "../assets/hospital-logo-large.png";


const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";

    const [formData, setFormData] = useState({
        username: "",
        password: "",
        remember: false
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setError("");
    };

    const handleLogin = (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate network delay for effect
        setTimeout(() => {
            // Simple mock authentication logic
            const username = formData.username.toLowerCase().trim();
            let role = null;

            if (username.includes("admin")) role = ROLES.ADMIN;
            else if (username.includes("clerk") && !username.includes("dept")) role = ROLES.HOSPITAL_CLERK;
            else if (username.includes("head") || username.includes("truong")) role = ROLES.HEAD_OF_DEPT;
            else if (username.includes("dept")) role = ROLES.DEPT_CLERK;
            else if (username.includes("khth")) role = ROLES.KHTH;
            else if (username.includes("staff") || username.includes("nhanu")) role = ROLES.STAFF;
            else if (username === "doctor") role = ROLES.STAFF; // Alias

            if (role) {
                login(role);
                navigate(from, { replace: true });
            } else {
                setError("Tên đăng nhập không tồn tại. Thử: admin, staff, head, clerk...");
                setIsLoading(false);
            }
        }, 800);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">

            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 bg-cover bg-center z-0"
                style={{ backgroundImage: `url(${hospitalHallway})` }}
            >
                <div className="absolute inset-0 bg-blue-900/60 backdrop-blur-[2px]"></div>
            </div>

            {/* Large Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
                <img
                    src={hospitalLogoLarge}
                    alt="Watermark"
                    className="w-[600px] opacity-40 blur-[2px]"
                />
            </div>

            {/* Content Container - Centered */}
            <div className="w-full max-w-md bg-white/75 backdrop-blur-xl p-8 rounded-3xl shadow-2xl shadow-blue-900/40 relative z-10 m-4 border border-white/50 animate-scale-in">

                {/* Background Pattern for Card */}
                <div
                    className="absolute inset-0 opacity-[0.05] pointer-events-none bg-repeat rounded-3xl"
                    style={{ backgroundImage: `url(${medicalPattern})`, backgroundSize: '300px' }}
                ></div>

                {/* Header Image (Banner or Logo) */}
                <div className="mb-8 flex justify-center relative z-10">
                    <img
                        src={hospitalLogoLarge}
                        alt="Hospital Logo"
                        className="h-24 object-contain drop-shadow-sm hover:scale-105 transition-transform"
                    />
                </div>

                <div className="text-center mb-8 relative z-10">
                    <h2 className="text-2xl font-bold text-slate-800">Đăng nhập hệ thống</h2>
                    <p className="text-slate-500 text-sm mt-2">Vui lòng nhập thông tin xác thực của bạn</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5 relative z-10">
                    {/* Username */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tài khoản</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                <User size={20} />
                            </div>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                placeholder="Nhập tên đăng nhập"
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mật khẩu</label>
                            <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">Quên mật khẩu?</a>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                <Lock size={20} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="block w-full pl-11 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Remember Me */}
                    <div className="flex items-center">
                        <label className="flex items-center space-x-3 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={formData.remember}
                                    onChange={handleChange}
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-300 transition-all checked:border-blue-500 checked:bg-blue-500 hover:border-blue-400"
                                />
                                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </span>
                            </div>
                            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors">Ghi nhớ đăng nhập</span>
                        </label>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg flex items-center gap-2 animate-shake">
                            <span className="font-bold">Lỗi:</span> {error}
                        </div>
                    )}

                    <button
                        type="sumbit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold text-base tracking-wide shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                Đăng nhập
                                <ChevronRight size={20} strokeWidth={3} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-200/60 flex items-center justify-center gap-2 text-xs text-slate-400 relative z-10">
                    <Building2 size={14} />
                    <span>Hệ thống nội bộ Bệnh viện Thái An</span>
                </div>
            </div>

            {/* Demo Credentials Hint - Fixed at bottom left */}
            <div className="fixed bottom-4 right-4 bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/10 text-white/80 hover:text-white transition-colors z-20">
                <p className="text-[10px]">Demo User: admin | Pass: any</p>
            </div>
        </div>
    );
};

export default Login;
