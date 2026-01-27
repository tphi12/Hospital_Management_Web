import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import hospitalLogoLarge from "../assets/hospital-logo-large.png";

const Layout = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex relative overflow-hidden">
            {/* Decorative Background Watermark */}
            <div className="fixed bottom-0 right-0 p-0 z-0 opacity-[0.03] pointer-events-none">
                <img src={hospitalLogoLarge} alt="Watermark" className="w-[500px] h-[500px] object-contain translate-x-1/4 translate-y-1/4 grayscale" />
            </div>

            {/* Sidebar - Fixed width */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col pl-64 transition-all relative z-10">
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
