import { useAuth } from "../hooks/useAuth";

const Dashboard = () => {
    const { user } = useAuth();

    return (
        <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Internal Medicine Department Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Pending Approvals</h3>
                    <p className="text-3xl font-bold text-slate-900">12</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-medium text-slate-500 mb-1">My Documents</h3>
                    <p className="text-3xl font-bold text-slate-900">34</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Upcoming Duty</h3>
                    <p className="text-3xl font-bold text-slate-900">Fri, 28th</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Welcome back, {user.name}</h2>
                <p className="text-slate-600">
                    This is the {user.role.toLowerCase().replace('_', ' ')} view. Use the sidebar to navigate to your specific tools.
                </p>
            </div>
        </div>
    );
};

export default Dashboard;
