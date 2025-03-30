import { JSX } from "react";
import { Navigate } from "react-router";
import { useAuthStore } from "@/stores/authStore";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

const ProtectedRoute = ({
    children,
    allowedRoles,
}: ProtectedRouteProps): JSX.Element => {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" replace />;
    }

    // Check roles if specified
    if (allowedRoles && allowedRoles.length > 0) {
        if (!user?.role || !allowedRoles.includes(user.role)) {
            // Redirect to an unauthorized page or dashboard if role not allowed
            // For simplicity, redirecting to dashboard for now
            console.warn(
                `Access denied for role: ${user?.role}. Required: ${allowedRoles.join(
                    ", "
                )}`
            );
            return <Navigate to="/" replace />; // Or to a specific '/unauthorized' page
        }
    }

    // User is authenticated and has the required role (if applicable)
    return <>{children}</>;
};

export default ProtectedRoute;