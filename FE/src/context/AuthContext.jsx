import { createContext, useState, useEffect } from "react";
import { ROLES } from "../lib/roles";

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} role
 * @property {string} department
 * @property {string} avatar
 */

/**
 * @typedef {Object} AuthContextType
 * @property {User|null} user
 * @property {Function} login
 * @property {Function} logout
 * @property {boolean} isLoading
 */

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Simulate picking up a session
    useEffect(() => {
        const storedUser = localStorage.getItem("hms_user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

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
