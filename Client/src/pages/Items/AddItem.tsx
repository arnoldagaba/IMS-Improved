import { useState, JSX } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { ItemForm } from "@/components/items/ItemForm";
import { createItem } from "@/services/item.service";
import { Item } from "@/types/inventory";

const AddItem = (): JSX.Element => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddItem = async (
        data:
            | Omit<Item, "id" | "createdAt" | "updatedAt" | "category">
            | Partial<Omit<Item, "id" | "createdAt" | "updatedAt" | "category">>
    ) => {
        setIsSubmitting(true);
        toast.dismiss();

        if (!data.sku || !data.name || !data.unitOfMeasure || !data.categoryId) {
            toast.error(
                "Please fill in all required fields (SKU, Name, Category, Unit)."
            );
            return;
        }

        const validatedData = data as Omit<
            Item,
            "id" | "createdAt" | "updatedAt" | "category"
        >;
        if (!validatedData) {
            throw new Error("Invalid data");
        }

        try {
            const newItem = await createItem(validatedData);
            toast.success(`Item "${newItem.name}" created successfully!`);
            navigate("/items"); // Redirect to items list after creation
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            const errorMsg =
                error.error?.message || error.message || "Failed to create item.";
            console.error("Create item error details:", error);
            toast.error(`Error: ${errorMsg}`);
            setIsSubmitting(false); // Keep form enabled on error
        }
        // No need for finally block if navigating away on success
    };

    return (
        <div>
            <h1 className="mb-4 text-3xl font-semibold text-gray-800">
                Add New Item
            </h1>
            
            <ItemForm
                onSubmit={handleAddItem}
                isSubmitting={isSubmitting}
                submitButtonText="Create Item"
            />
        </div>
    );
};

export default AddItem;
