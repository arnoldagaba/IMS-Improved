import { JSX } from "react";
import { Outlet } from "react-router";
import { ToastContainer } from "react-toastify";

const AuthLayout = (): JSX.Element => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 p-4">
            {/* Toast Container for auth pages */}
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
                theme="colored"
            />

            <Outlet />
        </div>
    );
};

export default AuthLayout;
