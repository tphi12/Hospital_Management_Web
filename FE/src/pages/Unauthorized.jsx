import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                <ShieldAlert size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
            <p className="text-slate-500 max-w-md mb-8">
                You do not have permission to view this page. Please contact your administrator if you believe this is an error.
            </p>
            <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
                Go Back
            </button>
        </div>
    );
};

export default Unauthorized;
