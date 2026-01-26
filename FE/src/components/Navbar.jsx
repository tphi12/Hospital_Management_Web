import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Settings, Bell, User, LogOut, Menu, UserPlus, LogIn, Calendar, FileText, CreditCard, Clock } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifMenu, setShowNotifMenu] = useState(false);

    // Auto-close dropdowns when clicking outside
    const userMenuRef = useRef(null);
    const notifMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
            if (notifMenuRef.current && !notifMenuRef.current.contains(event.target)) {
                setShowNotifMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Generate Breadcrumb Title based on path
    const getPageTitle = () => {
        const path = location.pathname;
        if (path === "/") return "Dashboard";
        if (path.includes("/admin/users")) return "Quản lý Người dùng";
        if (path.includes("/admin/departments")) return "Quản lý Phòng ban";
        if (path.includes("/documents/upload")) return "Upload Tài liệu";
        if (path.includes("/documents/repository")) return "Danh sách Tài liệu";
        if (path.includes("/schedule/me")) return "Lịch trực của tôi";
        if (path.includes("/schedule/weekly")) return "Lịch công tác tuần";
        if (path.includes("/schedule/master")) return "Lịch trực toàn viện";
        return "Trang chủ";
    };

    const breadcrumb = getPageTitle();

    return (
        <nav className="relative flex flex-wrap items-center justify-between px-0 py-2 mx-6 transition-all shadow-none duration-250 ease-soft-in rounded-2xl lg:flex-nowrap lg:justify-start">
            <div className="flex items-center justify-between w-full px-4 py-1 mx-auto flex-wrap-inherit">

                {/* Breadcrumb */}
                <nav>
                    <ol className="flex flex-wrap pt-1 mr-12 bg-transparent rounded-lg sm:mr-16">
                        <li className="text-sm leading-normal">
                            <Link className="opacity-50 text-slate-700" to="/">Trang chủ</Link>
                        </li>
                        <li className="text-sm pl-2 capitalize leading-normal text-slate-700 before:float-left before:pr-2 before:text-slate-600 before:content-['/']" aria-current="page">
                            {breadcrumb}
                        </li>
                    </ol>
                    <h6 className="mb-0 font-bold capitalize text-slate-900">{breadcrumb}</h6>
                </nav>

                {/* Right Side Actions */}
                <div className="flex items-center mt-2 grow sm:mt-0 sm:mr-6 md:mr-0 lg:flex lg:basis-auto">
                    {/* Spacer */}
                    <div className="flex items-center md:ml-auto md:pr-4"></div>

                    <ul className="flex flex-row justify-end pl-0 mb-0 list-none md-max:w-full">

                        {/* Settings Icon (Static) */}
                        <li className="flex items-center px-3">
                            <a href="#" className="p-0 transition-all text-sm ease-nav-brand text-slate-500 hover:text-slate-700">
                                <Settings size={18} className="fixed-plugin-button-nav cursor-pointer" />
                            </a>
                        </li>

                        {/* Notifications Dropdown */}
                        <li className="relative flex items-center pr-3" ref={notifMenuRef}>
                            <a
                                href="#"
                                className="p-0 transition-all text-sm ease-nav-brand text-slate-500 hover:text-slate-700"
                                onClick={(e) => { e.preventDefault(); setShowNotifMenu(!showNotifMenu); }}
                            >
                                <Bell size={18} className="cursor-pointer" />
                            </a>

                            {/* Menu */}
                            {showNotifMenu && (
                                <ul className="absolute right-0 top-8 z-50 min-w-[250px] bg-white rounded-lg shadow-lg border border-slate-100 py-2 animate-scale-in origin-top-right">
                                    <li className="relative mb-2 px-2">
                                        <a className="block w-full py-2 px-3 clear-both whitespace-nowrap text-sm bg-transparent border-0 hover:bg-slate-50 rounded-lg transition-colors" href="#">
                                            <div className="flex py-1">
                                                <div className="inline-flex items-center justify-center mr-3 text-white transition-all duration-200 ease-in-out text-sm bg-blue-500 rounded-full h-9 w-9">
                                                    <Clock size={16} />
                                                </div>
                                                <div className="flex flex-col justify-center">
                                                    <h6 className="mb-1 text-sm font-normal text-slate-700">
                                                        <span className="font-bold">Tin nhắn mới</span> từ Laur
                                                    </h6>
                                                    <p className="mb-0 text-xs text-slate-400">
                                                        <Clock size={10} className="inline mr-1" />
                                                        13 phút trước
                                                    </p>
                                                </div>
                                            </div>
                                        </a>
                                    </li>
                                    <li className="relative mb-2 px-2">
                                        <a className="block w-full py-2 px-3 clear-both whitespace-nowrap text-sm bg-transparent border-0 hover:bg-slate-50 rounded-lg transition-colors" href="#">
                                            <div className="flex py-1">
                                                <div className="inline-flex items-center justify-center mr-3 text-white transition-all duration-200 ease-in-out text-sm bg-gradient-to-tl from-slate-800 to-slate-900 rounded-full h-9 w-9">
                                                    <FileText size={16} />
                                                </div>
                                                <div className="flex flex-col justify-center">
                                                    <h6 className="mb-1 text-sm font-normal text-slate-700">
                                                        <span className="font-bold">Tài liệu mới</span> đã tải lên
                                                    </h6>
                                                    <p className="mb-0 text-xs text-slate-400">
                                                        <Clock size={10} className="inline mr-1" />
                                                        1 ngày trước
                                                    </p>
                                                </div>
                                            </div>
                                        </a>
                                    </li>
                                    <li className="relative px-2">
                                        <a className="block w-full py-2 px-3 clear-both whitespace-nowrap text-sm bg-transparent border-0 hover:bg-slate-50 rounded-lg transition-colors" href="#">
                                            <div className="flex py-1">
                                                <div className="inline-flex items-center justify-center mr-3 text-white transition-all duration-200 ease-in-out text-sm bg-gradient-to-tl from-teal-400 to-teal-500 rounded-full h-9 w-9">
                                                    <Calendar size={16} />
                                                </div>
                                                <div className="flex flex-col justify-center">
                                                    <h6 className="mb-1 text-sm font-normal text-slate-700">
                                                        Lịch trực đã được gửi
                                                    </h6>
                                                    <p className="mb-0 text-xs text-slate-400">
                                                        <Clock size={10} className="inline mr-1" />
                                                        2 ngày trước
                                                    </p>
                                                </div>
                                            </div>
                                        </a>
                                    </li>
                                </ul>
                            )}
                        </li>

                        {/* User Dropdown */}
                        <li className="relative flex items-center pl-2" ref={userMenuRef}>
                            <a
                                href="#"
                                className="block px-0 py-2 text-sm font-semibold transition-all ease-nav-brand text-slate-600 hover:text-slate-800"
                                onClick={(e) => { e.preventDefault(); setShowUserMenu(!showUserMenu); }}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="bg-slate-200 rounded-full p-1.5 text-slate-600">
                                        <User size={16} />
                                    </div>
                                    <span className="hidden sm:inline">{user?.name || "Tài khoản"}</span>
                                </div>
                            </a>

                            {/* Menu */}
                            {showUserMenu && (
                                <ul className="absolute right-0 top-10 z-50 min-w-[200px] bg-white rounded-lg shadow-lg border border-slate-100 py-2 animate-scale-in origin-top-right">
                                    {user ? (
                                        <>
                                            <li className="px-2 mb-1">
                                                <Link to="/profile" className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                                                    <User size={16} className="text-slate-500" /> Hồ sơ cá nhân
                                                </Link>
                                            </li>
                                            <li className="px-2 mb-1">
                                                <Link to="/schedule/me" className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                                                    <Calendar size={16} className="text-slate-500" /> Lịch trực của tôi
                                                </Link>
                                            </li>
                                            <li className="border-t border-slate-100 my-1"></li>
                                            <li className="px-2">
                                                <button
                                                    onClick={logout}
                                                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                                                >
                                                    <LogOut size={16} /> Đăng xuất
                                                </button>
                                            </li>
                                        </>
                                    ) : (
                                        <>
                                            <li className="px-2 mb-1">
                                                <Link to="/login" className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                                                    <LogIn size={16} className="text-slate-500" /> Đăng nhập
                                                </Link>
                                            </li>
                                        </>
                                    )}
                                </ul>
                            )}
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
