import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ROLES } from "../lib/roles";

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";

    const handleLogin = (role) => {
        login(role);
        navigate(from, { replace: true });
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto flex items-center justify-center mb-4">
                        <span className="text-white font-bold text-2xl">H</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Hospital Management System</h1>
                    <p className="text-slate-500 mt-2">Select a role to login as (Demo Mode)</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {Object.values(ROLES).map((role) => (
                        <button
                            key={role}
                            onClick={() => handleLogin(role)}
                            className="p-3 text-sm font-medium border border-slate-200 rounded-lg hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all text-left capitalize"
                        >
                            {role.toLowerCase().replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Login;
