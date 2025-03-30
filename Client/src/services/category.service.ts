import apiClient from './api';

// Define Category type if not already done
export interface Category {
    id: string;
    name: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
}

/**
 * Fetches a list of all categories.
 */
export const getCategories = async (): Promise<Category[]> => {
    try {
        // Assuming your backend route is /categories
        const response = await apiClient.get<Category[]>('/categories');
        return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error fetching categories:', error);
        throw error.response?.data || error;
    }
};

// Add other category service functions (create, update, delete) if needed elsewhere