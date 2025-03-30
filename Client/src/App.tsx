import { useEffect } from "react";
import AppRouter from "@/routes/AppRoutes";
import { useAuthStore } from "@/stores/authStore";
import { connectSocket, disconnectSocket } from "@/services/socket";

function App() {
  // --- Manage Socket Connection based on Auth State ---
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      console.log("User authenticated, connecting socket...");
      connectSocket(); // Connect socket when user logs in
    } else {
      console.log("User not authenticated, disconnecting socket...");
      disconnectSocket(); // Disconnect if user logs out or session ends
    }

    // Optional: Cleanup on component unmount (App unmounts rarely)
    return () => {
        console.log("App unmounting, disconnecting socket.");
        disconnectSocket();
    };
  }, [isAuthenticated]);

  return <AppRouter />; 
}

export default App;
