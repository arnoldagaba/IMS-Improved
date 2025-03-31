import { useState, useEffect, FormEvent, JSX } from 'react';
import { Item } from '@/types/inventory';
import { Category } from '@/types/inventory';
import { getCategories } from '@/services/category.service';
import { toast } from 'react-toastify';

interface ItemFormProps {
    initialData?: Item | null; // Optional initial data for editing
    onSubmit: (data: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'category'> | Partial<Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'category'>>) => Promise<void>; // Callback on submit
    isSubmitting: boolean;
    submitButtonText?: string;
}

const ItemForm = ({
    initialData = null,
    onSubmit,
    isSubmitting,
    submitButtonText = 'Save Item'
}: ItemFormProps): JSX.Element => {
    // State for form fields - initialize with initialData or defaults
    const [sku, setSku] = useState(initialData?.sku || '');
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [unitOfMeasure, setUnitOfMeasure] = useState(initialData?.unitOfMeasure || 'pcs'); // Default unit?
    const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
    const [lowStockThreshold, setLowStockThreshold] = useState<string>( // Store as string for input field
        initialData?.lowStockThreshold?.toString() || ''
    );
    const [costPrice, setCostPrice] = useState<string>( // Store as string for input field
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (initialData as any)?.costPrice?.toString() || '' // Access costPrice if available
    );
    const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');

    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    // Fetch categories for the dropdown
    useEffect(() => {
        const fetchCategories = async () => {
            setLoadingCategories(true);
            try {
                const fetchedCategories = await getCategories(); // Assuming getCategories exists
                setCategories(fetchedCategories);
                if (!initialData && fetchedCategories.length > 0 && !categoryId) {
                    // Optionally default to the first category if creating new
                    setCategoryId(fetchedCategories[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error);
                toast.error("Could not load categories for selection.");
            } finally {
                setLoadingCategories(false);
            }
        };
        
        fetchCategories();
    }, [categoryId, initialData]); // Refetch shouldn't be needed unless initialData changes drastically

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        // Basic frontend validation (more robust validation happens on backend)
        if (!sku || !name || !categoryId || !unitOfMeasure) {
            toast.warn('Please fill in all required fields (SKU, Name, Category, Unit).');
            return;
        }

        // Prepare data payload
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formData: any = { // Use 'any' temporarily or create specific input types
            sku,
            name,
            description: description || null, // Send null if empty
            unitOfMeasure,
            categoryId,
            // Convert threshold and cost price back to numbers or null
            lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold, 10) : null,
            costPrice: costPrice ? parseFloat(costPrice) : null, // Use parseFloat for decimals
            imageUrl: imageUrl || null,
        };

        // Handle potential NaN values after parsing
        if (formData.lowStockThreshold !== null && isNaN(formData.lowStockThreshold)) {
            toast.warn('Invalid number for Low Stock Threshold.');
            return;
        }
        if (formData.costPrice !== null && isNaN(formData.costPrice)) {
            toast.warn('Invalid number for Cost Price.');
            return;
        }

        // Remove fields not present in initialData if editing (partial update)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let submitData: any = formData;
        if (initialData) {
            submitData = {};
            Object.keys(formData).forEach(key => {
                // Only include changed fields or required fields for update
                // Or simply send all, letting backend handle partial update based on presence
                // Let's send all optional fields if they have a value or changed
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (formData[key] !== (initialData as any)[key]) {
                    submitData[key] = formData[key];
                }
                // Ensure required fields that haven't changed are still potentially included if needed by backend PUT
                if (['sku', 'name', 'unitOfMeasure', 'categoryId'].includes(key) && !(key in submitData)) {
                    submitData[key] = formData[key]; // Check if backend requires these even if unchanged
                }

            });
            // Ensure at least one field is being submitted for update
            if (Object.keys(submitData).length === 0) {
                toast.info("No changes detected.");
                return;
            }
        }


        onSubmit(submitData); // Pass data to parent component's handler
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white rounded-lg shadow">
            {/* Form Title (passed via parent or hardcoded) */}
            <h2 className="text-xl font-semibold text-gray-700"> {initialData ? 'Edit' : 'Create'} Item </h2>

            {/* Grid Layout for Fields */}
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                {/* SKU */}
                <div>
                    <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                        SKU <span className="text-red-600">*</span>
                    </label>

                    <input
                        type="text"
                        id="sku"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        required
                        className="block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm focus:outline-none"
                        disabled={isSubmitting}
                    />
                </div>

                {/* Name */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Name <span className="text-red-600">*</span>
                    </label>

                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        disabled={isSubmitting}
                    />
                </div>

                {/* Category */}
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        Category <span className="text-red-600">*</span>
                    </label>

                    <select
                        id="category"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        required
                        disabled={loadingCategories || isSubmitting}
                        className="block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                        <option value="" disabled>
                            {loadingCategories ? 'Loading...' : '-- Select Category --'}
                        </option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                    {/* Add link to create category? */}
                </div>

                {/* Unit of Measure */}
                <div>
                    <label htmlFor="unitOfMeasure" className="block text-sm font-medium text-gray-700">
                        Unit of Measure <span className="text-red-600">*</span>
                    </label>

                    <input
                        type="text"
                        id="unitOfMeasure"
                        value={unitOfMeasure}
                        onChange={(e) => setUnitOfMeasure(e.target.value)}
                        required
                        placeholder="e.g., pcs, kg, box"
                        className="block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        disabled={isSubmitting}
                    />
                </div>

                {/* Low Stock Threshold */}
                <div>
                    <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700">
                        Low Stock Threshold
                    </label>

                    <input
                        type="number"
                        id="lowStockThreshold"
                        value={lowStockThreshold}
                        onChange={(e) => setLowStockThreshold(e.target.value)}
                        min="0"
                        step="1"
                        placeholder="e.g., 10"
                        className="block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        disabled={isSubmitting}
                    />
                </div>

                {/* Cost Price */}
                <div>
                    <label htmlFor="costPrice" className="block text-sm font-medium text-gray-700">
                        Cost Price (UGX)
                    </label>

                    <input
                        type="number"
                        id="costPrice"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                        min="0"
                        step="0.01" // Allow decimals
                        placeholder="e.g., 20000"
                        className="block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        disabled={isSubmitting}
                    />
                </div>

                {/* Image URL */}
                <div className="md:col-span-2">
                    <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                        Image URL
                    </label>

                    <input
                        type="url"
                        id="imageUrl"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        disabled={isSubmitting}
                    />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description <span className="text-red-600">*</span>
                    </label>

                    <textarea
                        id="description"
                        rows={3}
                        value={description ?? ''} // Handle null value
                        onChange={(e) => setDescription(e.target.value)}
                        className="block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        disabled={isSubmitting}
                    />
                </div>
            </div>

            {/* Submit Button */}
            <div className="pt-5 text-right">
                <button
                    type="submit"
                    disabled={isSubmitting || loadingCategories}
                    className={`inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${(isSubmitting || loadingCategories) ? 'cursor-not-allowed opacity-50' : ''
                        }`}
                >
                    {isSubmitting ? 'Saving...' : submitButtonText}
                </button>

                {/* Optional Cancel Button/Link */}
                {/* <Link to="/items" className="ml-3 ...">Cancel</Link> */}
            </div>
        </form>
    );
};

export { ItemForm };