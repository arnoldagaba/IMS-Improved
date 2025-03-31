import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Define the structure of the authenticated user stored in the state
// Mirroring AuthenticatedUser from backend types is good practice
interface UserState {
    id: string;
    role: string; // Consider using the Role enum type if shared
    username?: string; // Optional: Store username if available from login response
    // Add other non-sensitive fields as needed
}

// Define the state structure and actions
interface AuthState {
    user: UserState | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    setUser: (user: UserState | null) => void;
    setAccessToken: (token: string | null) => void;
    logout: () => void;
}

// Create the store with persistence
export const useAuthStore = create<AuthState>()(
    // Persist allows state to be saved (e.g., in localStorage)
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,

            setUser: (user) =>
                set(() => {
                    const isAuthenticated = !!user; // Check if user is truthy
                    if (!isAuthenticated) {
                        // Also clear token if user is set to null
                        get().setAccessToken(null);
                    }
                    return { user, isAuthenticated };
                }),

            setAccessToken: (token) => set(() => ({ accessToken: token })),

            logout: () =>
                set(() => {
                    // Clear user and token
                    // Note: Cookie clearing happens via API call/browser mechanism
                    console.log("Logging out from store...");
                    return { user: null, accessToken: null, isAuthenticated: false };
                }),
        }),
        {
            name: "auth-storage", // Name of the item in storage
            storage: createJSONStorage(() => localStorage), // Use localStorage (sessionStorage is another option)
            // Optional: Only persist parts of the state (e.g., don't persist accessToken for security maybe?)
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);

// --- Optional: Selector hook for easier access ---
export const useAuth = () => useAuthStore((state) => state);
