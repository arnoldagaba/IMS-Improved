import { useState, useEffect, JSX } from 'react';
import { toast } from 'react-toastify';
import { getCategories, deleteCategory, createCategory, updateCategory, CreateCategoryInput, UpdateCategoryInput } from '@/services/category.service';
import { Category } from '@/types/inventory';
import CategoryForm from '@/components/categories/CategoryForm';
import { Modal } from '@/components/common/Modal';
import { useAuthStore } from '@/stores/authStore';
import { Pencil, Plus, Trash } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ConfirmationModal } from '@/components/ConfirmationModal';

const CategoriesPage = (): JSX.Element => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const { user } = useAuthStore(); // Get user role
  const isAdmin = user?.role === 'ADMIN'; // Check if admin

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getCategories();
      setCategories(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch categories.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // --- Delete Handlers ---
  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    
    try {
      await deleteCategory(categoryToDelete.id);
      toast.success(`Category "${categoryToDelete.name}" deleted successfully.`);
      setCategoryToDelete(null);
      fetchCategories(); // Refresh list
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMsg = err.error?.message || err.message || 'Failed to delete category.';
      toast.error(`Deletion failed: ${errorMsg}`);
      console.error("Deletion error details:", err);
    }
  };

  // --- Form Modal Handlers ---
  const handleOpenFormModal = (category: Category | null = null) => {
    setCategoryToEdit(category); // null for create, category object for edit
    setShowFormModal(true);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setCategoryToEdit(null); // Clear edit state on close
    setIsSubmittingForm(false); // Reset submitting state
  }

  const handleFormSubmit = async (data: CreateCategoryInput | UpdateCategoryInput) => {
    setIsSubmittingForm(true);
    toast.dismiss();
    try {
      let message = '';
      if (categoryToEdit) {
        // Update Category
        const updatedCategory = await updateCategory(categoryToEdit.id, data);
        message = `Category "${updatedCategory.name}" updated successfully.`;
      } else {
        // Create Category
        const newCategory = await createCategory(data as CreateCategoryInput);
        message = `Category "${newCategory.name}" created successfully.`;
      }
      toast.success(message);
      handleCloseFormModal(); // Close modal on success
      fetchCategories(); // Refresh the list
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMsg = error.error?.message || error.message || `Failed to ${categoryToEdit ? 'update' : 'create'} category.`;
      console.error("Form submission error:", error);
      toast.error(`Error: ${errorMsg}`);
      setIsSubmittingForm(false); // Keep modal open on error
    }
  };


  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-gray-800">Categories</h1>
        {isAdmin && ( // Only show Add button to Admins
          <button
            onClick={() => handleOpenFormModal()}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add New Category
          </button>
        )}
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <div className="rounded-md bg-red-100 p-4 text-red-700">Error: {error}</div>}

      {!isLoading && !error && (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Description</th>
                {/* Add Item Count if available from API */}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Items</th>
                {isAdmin && ( // Only show actions column to Admins
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {categories.length > 0 ? categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{category.name}</td>
                  <td className="max-w-md truncate px-6 py-4 text-sm text-gray-500" title={category.description ?? ''}>{category.description || '-'}</td>
                  <td>{category._count?.items ?? 0}</td>
                  {isAdmin && (
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium space-x-2">
                      <button onClick={() => handleOpenFormModal(category)} title="Edit" className="text-indigo-600 hover:text-indigo-900 inline-block">
                        <Pencil className="h-5 w-5" />
                      </button>

                      <button onClick={() => handleDeleteClick(category)} title="Delete" className="text-red-600 hover:text-red-900 inline-block">
                        <Trash className="h-5 w-5" />
                      </button>
                    </td>
                  )}
                </tr>
              )) : (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} className="px-6 py-4 text-center text-sm text-gray-500">No categories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- Modals --- */}
      {/* Form Modal (for Create/Edit) */}
      {isAdmin && ( // Only render form modal for admins
        <Modal
          isOpen={showFormModal}
          onClose={handleCloseFormModal}
          title={categoryToEdit ? 'Edit Category' : 'Create New Category'}
        >
          <CategoryForm
            initialData={categoryToEdit}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmittingForm}
            submitButtonText={categoryToEdit ? 'Update Category' : 'Create Category'}
          />
        </Modal>
      )}


      {/* Delete Confirmation Modal */}
      {isAdmin && ( // Only render delete modal for admins
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Category"
          message={`Are you sure you want to delete the category "${categoryToDelete?.name}"? This cannot be undone. Items using this category may cause issues if not reassigned.`}
        />
      )}

    </div>
  );
};

export default CategoriesPage;