import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar - Fixed width */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col pl-64 transition-all">
                <Navbar />

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
