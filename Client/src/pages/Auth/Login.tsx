import { useState, FormEvent, JSX } from "react";
import { useNavigate, Navigate, Link } from "react-router";
import apiClient from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "react-toastify";

const Login = (): JSX.Element => {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { setUser, setAccessToken, isAuthenticated } = useAuthStore();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        toast.dismiss();

        try {
            const response = await apiClient.post("/auth/login", {
                identifier,
                password,
            });

            const { accessToken, user } = response.data;

            // Update state using Zustand actions
            setAccessToken(accessToken);
            setUser(user);

            toast.success(`Welcome back, ${user.username || user.email}!`);
            // Navigate to dashboard after successful login
            navigate('/', { replace: true }); // Navigate happens automatically via ProtectedRoute check
        } catch (error: any) {
            console.error("Login failed:", error);
            const errorMsg =
                error.response?.data?.error?.message ||
                error.message ||
                "Login failed. Please check your credentials.";
            toast.error(errorMsg);
            setPassword(""); // Clear password field on error
        } finally {
            setIsLoading(false);
        }
    };

    // If already authenticated, redirect away from login page
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-center text-3xl font-bold text-gray-800">
                Inventory Login
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label
                        htmlFor="identifier"
                        className="mb-1 block text-sm font-medium text-gray-700"
                    >
                        Username or Email
                    </label>

                    <input
                        type="text"
                        id="identifier"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                        className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        placeholder="yourname or user@example.com"
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <label
                        htmlFor="password"
                        className="mb-1 block text-sm font-medium text-gray-700"
                    >
                        Password
                    </label>

                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        placeholder="••••••••"
                        disabled={isLoading}
                    />

                    {/* Optional: Add forgot password link here */}
                    <div className="mt-1 text-right">
                        <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-500">
                            Forgot password?
                        </Link>
                    </div>
                </div>
                
                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isLoading
                                ? "cursor-not-allowed bg-indigo-400"
                                : "bg-indigo-600 hover:bg-indigo-700"
                            }`}
                    >
                        {isLoading ? "Signing In..." : "Sign In"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Login;
