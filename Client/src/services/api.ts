import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

// Base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create Axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // Important for sending cookies (like refreshToken)
});

// --- Request Interceptor ---
// Add the access token to the Authorization header for outgoing requests
apiClient.interceptors.request.use(
    (config) => {
        // Get token from Zustand store
        const token = useAuthStore.getState().accessToken;
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- Response Interceptor (for handling 401 & token refresh) ---
// Variable to prevent multiple concurrent refresh attempts
let isRefreshing = false;
let failedQueue: {
    resolve: (value: unknown) => void;
    reject: (reason?: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => {
        // Any status code within 2xx cause this function to trigger
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Check if error is 401 and it's not the refresh token request itself
        if (
            error.response?.status === 401 &&
            originalRequest.url !== "/auth/refresh"
        ) {
            if (isRefreshing) {
                // If token is already being refreshed, queue the original request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (originalRequest.headers) {
                            originalRequest.headers["Authorization"] = "Bearer " + token;
                        }
                        return apiClient(originalRequest); // Retry original request with new token
                    })
                    .catch((err) => {
                        return Promise.reject(err); // Propagate refresh error
                    });
            }

            // Start token refresh
            originalRequest._retry = true; // Mark request as retried
            isRefreshing = true;

            try {
                // Call the refresh token endpoint (cookie should be sent automatically)
                const { data } = await apiClient.post("/auth/refresh");
                const newAccessToken = data.accessToken;

                // Update token in Zustand store
                useAuthStore.getState().setAccessToken(newAccessToken);

                // Update the Authorization header for the original request
                if (originalRequest.headers) {
                    originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
                }

                // Process the queue with the new token
                processQueue(null, newAccessToken);

                // Retry the original request
                return apiClient(originalRequest);
            } catch (refreshError: any) {
                // Refresh token failed (e.g., refresh token invalid/expired)
                console.error("Token refresh failed:", refreshError);
                useAuthStore.getState().logout(); // Trigger logout in store
                processQueue(refreshError, null); // Reject queued requests
                // Redirect to login or trigger logout globally
                window.location.href = "/login"; // Simple redirect for now
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // For other errors, just reject
        return Promise.reject(error);
    }
);

export default apiClient;
