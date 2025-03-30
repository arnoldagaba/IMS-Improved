import { JSX } from "react";
import { Outlet, Link, useNavigate } from "react-router";
import { useAuthStore } from "@/stores/authStore";
import apiClient from "@/services/api";
import { ToastContainer } from "react-toastify";

const MainLayout = (): JSX.Element => {
    const { user, logout: logoutFromStore } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            // Call the backend logout endpoint (clears cookie, invalidates DB token)
            await apiClient.post("/auth/logout");
        } catch (error) {
            console.error("Logout API call failed:", error);
            // Still proceed with client-side logout even if API fails
        } finally {
            // Clear state in Zustand store
            logoutFromStore();
            // No explicit navigation needed here as ProtectedRoute will redirect
            navigate('/login'); // Or let ProtectedRoute handle redirect
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar Navigation */}
            <aside className="w-64 flex-shrink-0 bg-gradient-to-b from-slate-800 to-slate-900 p-4 text-white shadow-md">
                <h1 className="mb-6 border-b border-slate-700 pb-3 text-center text-2xl font-semibold">
                    IMS Pro
                </h1>
                <nav className="space-y-2">
                    <Link to="/" className="block rounded px-3 py-2 hover:bg-slate-700">
                        Dashboard
                    </Link>

                    <Link
                        to="/items"
                        className="block rounded px-3 py-2 hover:bg-slate-700"
                    >
                        Items
                    </Link>

                    <Link
                        to="/categories"
                        className="block rounded px-3 py-2 hover:bg-slate-700"
                    >
                        Categories
                    </Link>

                    <Link
                        to="/locations"
                        className="block rounded px-3 py-2 hover:bg-slate-700"
                    >
                        Locations
                    </Link>

                    <Link
                        to="/inventory"
                        className="block rounded px-3 py-2 hover:bg-slate-700"
                    >
                        Transactions
                    </Link>

                    {/* Conditional Links based on Role */}
                    {user?.role === "ADMIN" && (
                        <>
                            <Link
                                to="/reports"
                                className="block rounded px-3 py-2 hover:bg-slate-700"
                            >
                                Reports
                            </Link>

                            <Link
                                to="/admin/users"
                                className="block rounded px-3 py-2 hover:bg-slate-700"
                            >
                                Users
                            </Link>
                        </>
                    )}
                </nav>

                <div className="mt-auto pt-4">
                    {/* Push logout to bottom */}
                    <button
                        onClick={handleLogout}
                        className="w-full rounded bg-red-600 px-3 py-2 text-center font-medium hover:bg-red-700"
                    >
                        Logout ({user?.username || user?.id.substring(0, 6)})
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-6">
                {/* Toast Container - place it high level */}
                <ToastContainer
                    position="top-right"
                    autoClose={4000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="colored" // Or "light", "dark"
                />
                <Outlet /> {/* Child routes will render here */}
            </main>
        </div>
    );
};

export default MainLayout;
