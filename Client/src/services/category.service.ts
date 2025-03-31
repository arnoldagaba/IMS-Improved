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
        const response = await apiClient.get<Category[]>('/categories');
        return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error fetching categories:', error);
        throw error.response?.data || error;
    }
};

/**
 * Fetches details for a single category by ID.
 */
export const getCategoryById = async (id: string): Promise<Category> => {
    try {
        const response = await apiClient.get<Category>(`/categories/${id}`);
        return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error(`Error fetching category ${id}:`, error);
        throw error.response?.data || error;
    }
};

/**
 * Creates a new category.
 * Define a specific input type if needed, otherwise use Pick/Omit.
 */
export type CreateCategoryInput = Pick<Category, 'name' | 'description'>;
export const createCategory = async (categoryData: CreateCategoryInput): Promise<Category> => {
    try {
        const response = await apiClient.post<Category>('/categories', categoryData);
        return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error creating category:', error);
        throw error.response?.data || error;
    }
};

/**
 * Updates an existing category.
 */
export type UpdateCategoryInput = Partial<Pick<Category, 'name' | 'description'>>;
export const updateCategory = async (id: string, categoryData: UpdateCategoryInput): Promise<Category> => {
    try {
        const response = await apiClient.put<Category>(`/categories/${id}`, categoryData);
        return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error(`Error updating category ${id}:`, error);
        throw error.response?.data || error;
    }
};

/**
 * Deletes a category by ID.
 */
export const deleteCategory = async (id: string): Promise<void> => {
    try {
        await apiClient.delete(`/categories/${id}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error(`Error deleting category ${id}:`, error);
        throw error.response?.data || error;
    }
};