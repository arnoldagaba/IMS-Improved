import { useState, useEffect, JSX } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { toast } from "react-toastify";
import { ItemForm } from "@/components/items/ItemForm";
import { getItemById, updateItem } from "@/services/item.service";
import { Item } from "@/types/inventory";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ArrowLeft } from "lucide-react";

const EditItem = (): JSX.Element => {
    const { id } = useParams<{ id: string }>(); // Get item ID from URL
    const navigate = useNavigate();
    const [item, setItem] = useState<Item | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchItem = async () => {
            if (!id) {
                setError("No item ID provided.");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            
            try {
                const fetchedItem = await getItemById(id);
                setItem(fetchedItem);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                const errorMsg =
                    err.error?.message || err.message || "Failed to fetch item details.";
                console.error("Fetch item error:", err);
                setError(errorMsg);
                toast.error(errorMsg);
                if (err.response?.status === 404) {
                    navigate("/items", { replace: true }); // Go back if not found
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchItem();
    }, [id, navigate]);

    const handleUpdateItem = async (
        data: Partial<Omit<Item, "id" | "createdAt" | "updatedAt" | "category">>
    ) => {
        if (!id) return; // Should not happen if item was loaded

        // Check if data is empty (no changes made)
        if (Object.keys(data).length === 0) {
            toast.info("No changes were submitted.");
            return;
        }

        setIsSubmitting(true);
        toast.dismiss();
        try {
            const updatedItem = await updateItem(id, data);
            toast.success(`Item "${updatedItem.name}" updated successfully!`);
            setItem(updatedItem); // Update local state with new data
            
            // Optionally navigate back to list or stay on page
            navigate('/items');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            const errorMsg =
                error.error?.message || error.message || "Failed to update item.";
            console.error("Update item error details:", error);
            toast.error(`Error: ${errorMsg}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div className="rounded-md bg-red-100 p-4 text-red-700">
                Error loading item: {error}
            </div>
        );
    }

    if (!item) {
        // Should be handled by redirect in useEffect, but good fallback
        return <div className="text-center text-gray-500">Item not found.</div>;
    }

    return (
        <div>
            <Link
                to="/items"
                className="mb-4 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
            >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Items List
            </Link>

            <h1 className="mb-4 text-3xl font-semibold text-gray-800">
                Edit Item: {item.name}
            </h1>
            
            <ItemForm
                initialData={item} // Pass fetched item data to the form
                onSubmit={handleUpdateItem}
                isSubmitting={isSubmitting}
                submitButtonText="Update Item"
            />
            {/* Could add related info here like current stock levels */}
        </div>
    );
};

export default EditItem;
