import { useState } from "react";
import { AuthContext } from "./Context";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem("hms_user");
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const isLoading = false;


    /**
     * Mock login function
     * @param {string} role - Role to mimic login as
     */
    const login = (role) => {
        // Mock user data based on role
        const mockUser = {
            id: "u-123",
            name: `Demo ${role}`,
            role: role,
            department: "Internal Med",
            avatar: `https://ui-avatars.com/api/?name=${role}&background=random`
        };

        setUser(mockUser);
        localStorage.setItem("hms_user", JSON.stringify(mockUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("hms_user");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
