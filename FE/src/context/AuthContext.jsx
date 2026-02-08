import { useState, useEffect } from "react";
import { AuthContext } from "./Context";
import authService from "../services/authService";
import { ROLES } from "../lib/roles";

// Chuẩn hóa user từ API về dạng FE sử dụng
const normalizeUser = (apiUser = {}) => {
    const primaryRole = apiUser.roles?.[0]?.role_code || apiUser.roles?.[0]?.role_name || apiUser.role || ROLES.STAFF;
    return {
        id: apiUser.user_id,
        username: apiUser.username,
        email: apiUser.email,
        fullName: apiUser.full_name,
        departmentId: apiUser.department_id,
        roles: apiUser.roles || [],
        role: primaryRole,
    };
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem("user");
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [isLoading, setIsLoading] = useState(false);

    // Validate token on mount
    useEffect(() => {
        const validateToken = async () => {
            const token = localStorage.getItem("token");
            if (token && !user) {
                try {
                    const response = await authService.getProfile();
                    const apiUser = response?.data?.data || response?.data?.user || response?.data;
                    if (apiUser) {
                        const normalized = normalizeUser(apiUser);
                        setUser(normalized);
                        localStorage.setItem("user", JSON.stringify(normalized));
                    }
                } catch {
                    // Token không hợp lệ, xóa đi
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                }
            }
        };
        validateToken();
    }, [user]);

    /**
     * Login function - call API
     * @param {string} username - Username or Email
     * @param {string} password - Password
     */
    const login = async (username, password) => {
        setIsLoading(true);
        try {
            const response = await authService.login(username, password);
            // authService.login trả về { success, message, data: { token, user } }
            const { token, user: apiUser } = response?.data || {};
            if (!token || !apiUser) {
                throw new Error("Thiếu token hoặc user từ server");
            }

            const normalized = normalizeUser(apiUser);

            // Save to localStorage
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(normalized));
            
            setUser(normalized);
            setIsLoading(false);
            return { success: true };
        } catch (error) {
            setIsLoading(false);
            return {
                success: false,
                message: error.response?.data?.message || "Đăng nhập thất bại"
            };
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const updateUser = async () => {
        try {
            const response = await authService.getProfile();
            const apiUser = response?.data?.data || response?.data?.user || response?.data;
            if (apiUser) {
                const normalized = normalizeUser(apiUser);
                setUser(normalized);
                localStorage.setItem("user", JSON.stringify(normalized));
            }
        } catch (error) {
            console.error("Failed to update user:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
