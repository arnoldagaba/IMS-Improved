import apiClient from "./api";
import { Item } from "@/types/inventory";

/**
 * Fetches a list of all items.
 */
export const getItems = async (): Promise<Item[]> => {
    try {
        const response = await apiClient.get<Item[]>("/items"); // Specify expected response type
        return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Error fetching items:", error);
        // Re-throw or handle error appropriately (axios interceptor handles 401)
        throw error.response?.data || error;
    }
};

/**
 * Fetches details for a single item by ID.
 */
export const getItemById = async (id: string): Promise<Item> => {
    try {
        const response = await apiClient.get<Item>(`/items/${id}`);
        return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error(`Error fetching item ${id}:`, error);
        throw error.response?.data || error;
    }
};

/**
 * Creates a new item.
 * Input type should match backend CreateItemInput validation.
 */
export const createItem = async (
    itemData: Omit<Item, "id" | "createdAt" | "updatedAt" | "category">
): Promise<Item> => {
    try {
        // Adjust itemData keys/structure if needed to match backend exactly
        const response = await apiClient.post<Item>("/items", itemData);
        return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Error creating item:", error);
        throw error.response?.data || error;
    }
};

/**
 * Updates an existing item.
 * Input type should match backend UpdateItemInput validation.
 */
export const updateItem = async (
    id: string,
    itemData: Partial<Omit<Item, "id" | "createdAt" | "updatedAt" | "category">>
): Promise<Item> => {
    try {
        // Adjust itemData keys/structure if needed
        const response = await apiClient.put<Item>(`/items/${id}`, itemData);
        return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error(`Error updating item ${id}:`, error);
        throw error.response?.data || error;
    }
};

/**
 * Deletes an item by ID.
 */
export const deleteItem = async (id: string): Promise<void> => {
    try {
        await apiClient.delete(`/items/${id}`);
        // DELETE often returns 204 No Content, so no response data expected
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error(`Error deleting item ${id}:`, error);
        throw error.response?.data || error;
    }
};
