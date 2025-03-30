// Based on backend Item schema (excluding timestamps if not needed for display)
// Match the structure returned by GET /api/v1/items
export interface Item {
    id: string;
    sku: string;
    name: string;
    description?: string | null;
    unitOfMeasure: string;
    lowStockThreshold?: number | null;
    imageUrl?: string | null;
    categoryId: string;
    createdAt: string; // Assuming ISO string format from backend
    updatedAt: string; // Assuming ISO string format from backend
    category?: {
        // Optional category details if included by the API endpoint
        name: string;
    };
    // Add other fields returned by your specific API endpoint if needed
}

// Interface for API responses that include pagination (like for transactions later)
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
    };
}

export interface Category {
    id: string;
    name: string;
    description?: string | null;
    createdAt: string; // Assuming ISO string format
    updatedAt: string; // Assuming ISO string format
    // Add _count if your API includes item counts, e.g.,
    _count?: { items: number };
}
