import { useState, useEffect } from "react";
import { AuthContext } from "./Context";
import authService from "../services/authService";
import { ROLES } from "../lib/roles";

// Chuẩn hóa user từ API về dạng FE sử dụng
const normalizeUser = (apiUser = {}) => {
    const primaryRole = apiUser.roles?.[0]?.role_code || apiUser.roles?.[0]?.role_name || apiUser.role || ROLES.STAFF;
    const fallbackRoleDept = apiUser.roles?.find((r) => r?.department_code || r?.department_name);
    return {
        id: apiUser.user_id,
        username: apiUser.username,
        email: apiUser.email,
        fullName: apiUser.full_name,
        departmentId: apiUser.department_id,
        departmentCode: apiUser.department_code || fallbackRoleDept?.department_code || null,
        departmentName: apiUser.department_name || fallbackRoleDept?.department_name || null,
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

            console.log("[AUTH_LOGIN_RAW_RESPONSE]", {
                user_id: apiUser?.user_id,
                department_id: apiUser?.department_id,
                roles: apiUser?.roles,
                token_present: Boolean(token),
            });

            const normalized = normalizeUser(apiUser);
            const hasClerkRole = (normalized?.roles || []).some(
                (role) => role?.role_code === ROLES.DEPT_CLERK || role?.role_code === "CLERK"
            );

            // Save to localStorage
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(normalized));
            
            setUser(normalized);

            console.log("[AUTH_STORE_AFTER_LOGIN]", {
                user: normalized,
                hasClerkRole,
                storedUser: JSON.parse(localStorage.getItem("user") || "null"),
                tokenPresentInStorage: Boolean(localStorage.getItem("token")),
            });

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
