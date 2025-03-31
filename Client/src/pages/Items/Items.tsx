import { useState, useEffect, JSX } from "react";
import { Eye, Pencil, Plus, Trash } from "lucide-react";
import { Link } from "react-router";
import { toast } from "react-toastify";
import { getItems, deleteItem } from "@/services/item.service";
import { Item } from "@/types/inventory";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ConfirmationModal } from "@/components/ConfirmationModal";

const Items = (): JSX.Element => {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

  const fetchItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getItems();
      setItems(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMsg = err.message || "Failed to fetch items.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []); // Fetch items on component mount

  const handleDeleteClick = (item: Item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteItem(itemToDelete.id);
      toast.success(`Item "${itemToDelete.name}" deleted successfully.`);
      setItemToDelete(null);
      // Refetch items list after deletion
      fetchItems();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMsg =
        err.error?.message || err.message || "Failed to delete item.";
      toast.error(`Deletion failed: ${errorMsg}`);
      console.error("Deletion error details:", err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-semibold text-gray-800">Items</h1>
        <Link
          to="/items/new" // Link to a future "Create Item" page
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Plus className="w-5 h-5 mr-2 -ml-1" aria-hidden="true" />
          Add New Item
        </Link>
      </div>

      {isLoading && <LoadingSpinner />}
      {error && (
        <div className="p-4 text-red-700 bg-red-100 rounded-md">
          Error: {error}
        </div>
      )}

      {!isLoading && !error && (
        <div className="overflow-hidden bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  SKU
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Category
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Unit
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Threshold
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {item.sku}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {item.category?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {item.unitOfMeasure}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {item.lowStockThreshold ?? "-"}
                    </td>
                    <td className="px-6 py-4 space-x-2 text-sm font-medium text-right whitespace-nowrap">
                      {/* Link to a future detail/edit page */}
                      <Link
                        to={`/items/${item.id}`}
                        title="View/Edit"
                        className="inline-block text-indigo-600 hover:text-indigo-900"
                      >
                        <Eye className="w-5 h-5" />
                        {/* Edit */}
                      </Link>

                      <Link
                        to={`/items/edit/${item.id}`}
                        title="Edit"
                        className="inline-block text-indigo-600 hover:text-indigo-900"
                      >
                        <Pencil className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(item)}
                        title="Delete"
                        className="inline-block text-red-600 hover:text-red-900"
                      >
                        <Trash className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-sm text-center text-gray-500"
                  >
                    No items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Item"
        message={`Are you sure you want to delete the item "${itemToDelete?.name}" (SKU: ${itemToDelete?.sku})? This action cannot be undone.`}
      />
    </div>
  );
};

export default Items;
