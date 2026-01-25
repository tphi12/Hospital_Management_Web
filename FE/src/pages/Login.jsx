import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ROLES } from "../lib/roles";
import { User, Lock, Eye, EyeOff, Building2 } from "lucide-react";

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
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-100 via-sky-50 to-blue-200 relative overflow-hidden">

            {/* Abstract Background Shapes (CSS approximation of the reference) */}
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-blue-200 to-transparent"></div>
                <div className="absolute top-20 right-20 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-sky-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl z-10 p-10 m-4">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-20 h-20 mb-4 bg-white p-2 rounded-lg shadow-sm flex items-center justify-center">
                        {/* Placeholder for the hospital logo */}
                        <div className="w-full h-full border-4 border-blue-500 rounded flex items-center justify-center text-blue-600">
                            <Building2 className="w-10 h-10" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Bệnh viện Thái An</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Chào mừng bạn trở lại!</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-5">

                    {/* Username Input */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                            <User size={18} />
                        </div>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm"
                            placeholder="Tên người dùng / Email"
                            required
                        />
                    </div>

                    {/* Password Input */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                            <Lock size={18} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm"
                            placeholder="Mật khẩu"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {/* Remember & Forgot Password */}
                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center space-x-2 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={formData.remember}
                                    onChange={handleChange}
                                    className="peer sr-only"
                                />
                                <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-100 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </div>
                            <span className="text-slate-500 group-hover:text-slate-700 transition-colors">Ghi nhớ</span>
                        </label>
                        <a href="#" className="font-medium text-pink-500 hover:text-pink-600 transition-colors">
                            Quên mật khẩu?
                        </a>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="button" // Change to submit in real app, button here because we intercept for demo
                        onClick={handleLogin}
                        className="w-full bg-slate-900	 text-white py-3 rounded-lg font-bold text-sm tracking-wide uppercase hover:bg-slate-800 active:scale-[0.98] transition-all shadow-lg shadow-slate-200"
                    >
                        Đăng nhập
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-400">
                        Hỗ trợ kỹ thuật: <span className="font-semibold text-pink-500">Phòng IT</span>
                    </p>
                </div>

                {/* Demo Hints */}
                <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-800">
                    <p className="font-bold mb-1">💡 Demo Credentials:</p>
                    <div className="grid grid-cols-2 gap-1 text-blue-600/80">
                        <span>admin</span>
                        <span>staff / doctor</span>
                        <span>head (Trưởng phòng)</span>
                        <span>clerk (Văn thư)</span>
                        <span>dept (Văn thư PB)</span>
                        <span>khth (KHTH)</span>
                    </div>
                    <p className="mt-2 opacity-70">Password: any</p>
                </div>

            </div>
        </div>
    );
};

export default Login;
