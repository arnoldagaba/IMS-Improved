import { useState, FormEvent, useEffect, JSX } from "react";
import { Category } from "@/types/inventory";
import { toast } from "react-toastify";

interface CategoryFormProps {
    initialData?: Category | null;
    onSubmit: (
        data:
            | Pick<Category, "name" | "description">
            | Partial<Pick<Category, "name" | "description">>
    ) => Promise<void>;
    isSubmitting: boolean;
    submitButtonText?: string;
}

const CategoryForm = ({
    initialData = null,
    onSubmit,
    isSubmitting,
    submitButtonText = "Save Category",
}: CategoryFormProps): JSX.Element => {
    const [name, setName] = useState(initialData?.name || "");
    const [description, setDescription] = useState(
        initialData?.description || ""
    );

    // Update state if initialData changes (e.g., navigating between edits)
    useEffect(() => {
        setName(initialData?.name || "");
        setDescription(initialData?.description || "");
    }, [initialData]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!name) {
            toast.warn("Category name is required.");
            return;
        }

        const formData = {
            name,
            description: description || null,
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let submitData: any = formData;
        if (initialData) {
            submitData = {};
            if (formData.name !== initialData.name) submitData.name = formData.name;
            if (formData.description !== initialData.description)
                submitData.description = formData.description;

            if (Object.keys(submitData).length === 0) {
                toast.info("No changes detected.");
                return;
            }
        }

        onSubmit(submitData);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-lg bg-white p-6 shadow"
        >
            {/* Name */}
            <div>
                <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                >
                    Name <span className="text-red-600">*</span>
                </label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    disabled={isSubmitting}
                />
            </div>

            {/* Description */}
            <div>
                <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700"
                >
                    Description
                </label>
                <textarea
                    id="description"
                    rows={3}
                    value={description ?? ""}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    disabled={isSubmitting}
                />
            </div>

            {/* Submit Button */}
            <div className="pt-5 text-right">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isSubmitting ? "cursor-not-allowed opacity-50" : ""
                        }`}
                >
                    {isSubmitting ? "Saving..." : submitButtonText}
                </button>
            </div>
        </form>
    );
};

export default CategoryForm;
