import { createContext } from "react";

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
