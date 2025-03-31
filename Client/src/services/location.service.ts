import apiClient from "./api";
import { Location } from "@/types/inventory";

export type CreateLocationInput = Omit<
    Location,
    "id" | "createdAt" | "updatedAt"
>;
export type UpdateLocationInput = Partial<CreateLocationInput>;

export const getLocations = async (): Promise<Location[]> => {
    try {
        const response = await apiClient.get<Location[]>("/locations");
        return response.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Error fetching locations:", error);
        throw error.response?.data || error;
    }
};

export const getLocationById = async (id: string): Promise<Location> => {
    try {
        const response = await apiClient.get<Location>(`/locations/${id}`);
        return response.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error(`Error fetching location ${id}:`, error);
        throw error.response?.data || error;
    }
};

export const createLocation = async (
    locationData: CreateLocationInput
): Promise<Location> => {
    try {
        const response = await apiClient.post<Location>("/locations", locationData);
        return response.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error creating location:', error);
        throw error.response?.data || error;
    }
};

export const updateLocation = async (
    id: string,
    locationData: UpdateLocationInput
): Promise<Location> => {
    try {
        const response = await apiClient.put<Location>(
            `/locations/${id}`,
            locationData
        );
        return response.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error(`Error updating location ${id}:`, error);
        throw error.response?.data || error;
    }
};

export const deleteLocation = async (id: string): Promise<void> => {
    try {
        await apiClient.delete(`/locations/${id}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error(`Error deleting location ${id}:`, error);
        throw error.response?.data || error;
    }
};
