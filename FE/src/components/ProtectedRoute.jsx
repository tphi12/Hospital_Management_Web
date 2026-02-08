import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import PropTypes from 'prop-types';

/**
 * Protected Route Component
 * Check if user is authenticated and has the required role.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string[]} [props.allowedRoles] - List of roles allowed to access this route
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
    allowedRoles: PropTypes.arrayOf(PropTypes.string),
};

export default ProtectedRoute;
