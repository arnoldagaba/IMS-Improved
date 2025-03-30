import { JSX } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { useAuthStore } from "@/stores/authStore";

// Layouts
import MainLayout from "@/layouts/MainLayout";
import AuthLayout from "@/layouts/AuthLayout";

// Pages
import Login from "@/pages/Auth/Login";
import Dashboard from "@/pages/Dashboard/Dashboard";
import Items from "@/pages/Items/Items";
import ItemDetail from "@/pages/Items/ItemDetail";
import Categories from "@/pages/Categories/Categories";
import Locations from "@/pages/Locations/Locations";
import StockTransactions from "@/pages/Transactions/StockTransactions";
import Reports from "@/pages/Reports/Reports";
import Users from "@/pages/Admin/Users";
import NotFound from "@/pages/NotFound";

// Protected Route Component
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

const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Routes WITHOUT Main Layout (e.g., Login) */}
                <Route element={<AuthLayout />}>
                    {/* Optional Auth Layout */}
                    <Route path="/login" element={<Login />} />
                    {/* Add Register, Forgot Password routes here if needed */}
                </Route>

                {/* Routes WITH Main Layout (Protected) */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <MainLayout />
                        </ProtectedRoute>
                    }
                >
                    {/* Index route (dashboard) */}
                    <Route index element={<Dashboard />} />
                    {/* Item Management */}
                    <Route path="items" element={<Items />} />
                    <Route path="items/:id" element={<ItemDetail />} />
                    {/* Example detail route */}
                    {/* Add create/edit item routes if they are separate pages */}
                    {/* Categories (Assume STAFF can view, ADMIN can manage - handled by API) */}
                    <Route path="categories" element={<Categories />} />
                    {/* Locations (Assume STAFF can view, ADMIN can manage - handled by API) */}
                    <Route path="locations" element={<Locations />} />
                    {/* Inventory & Transactions */}
                    <Route path="inventory" element={<StockTransactions />} />
                    {/* Combine view? Or separate pages */}
                    {/* Maybe rename path to "transactions"? */}
                    {/* Reports (Protected by Role) */}
                    <Route
                        path="reports"
                        element={
                            <ProtectedRoute allowedRoles={["ADMIN"]}>
                                {/* Restrict reports */}
                                <Reports />
                            </ProtectedRoute>
                        }
                    />

                    {/* Admin Section (Protected by Role) */}
                    <Route
                        path="admin/users"
                        element={
                            <ProtectedRoute allowedRoles={["ADMIN"]}>
                                {/* Restrict user management */}
                                <Users />
                            </ProtectedRoute>
                        }
                    />
                    {/* Catch-all 404 */}
                    <Route path="*" element={<NotFound />} />
                </Route>

                {/* An alternative explicit 404 outside main layout if needed */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;
