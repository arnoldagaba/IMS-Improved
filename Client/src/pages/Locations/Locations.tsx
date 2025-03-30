import { useState, useEffect, JSX } from "react";
import { toast } from "react-toastify";
import {
  getLocations,
  deleteLocation,
  createLocation,
  updateLocation,
  CreateLocationInput,
  UpdateLocationInput,
} from "@/services/location.service";
import { Location } from "@/types/inventory";
import LocationForm from "@/components/locations/LocationForm";
import { Modal } from "@/components/common/Modal";
import { useAuthStore } from "@/stores/authStore";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Pencil, Plus, Star, Trash } from "lucide-react";
import { ConfirmationModal } from "@/components/ConfirmationModal";

const Locations = (): JSX.Element => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(
    null
  );
  const [showFormModal, setShowFormModal] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<Location | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const fetchLocations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getLocations();
      setLocations(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMsg = err.message || "Failed to fetch categories.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // --- Delete Handlers ---
  const handleDeleteClick = (location: Location) => {
    setLocationToDelete(location);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!locationToDelete) return;

    try {
      await deleteLocation(locationToDelete.id);
      toast.success(`Location "${locationToDelete.name}" deleted.`);
      setLocationToDelete(null);
      fetchLocations();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMsg =
        err.error?.message || err.message || "Failed to delete category.";
      toast.error(`Deletion failed: ${errorMsg}`);
      console.error("Deletion error details:", err);
    }
  };

  // --- Form Modal Handlers ---
  const handleOpenFormModal = (location: Location | null = null) => {
    setLocationToEdit(location);
    setShowFormModal(true);
  };
  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setLocationToEdit(null);
    setIsSubmittingForm(false);
  };

  const handleFormSubmit = async (
    data: CreateLocationInput | UpdateLocationInput
  ) => {
    setIsSubmittingForm(true);
    toast.dismiss();

    try {
      let message = "";
      if (locationToEdit) {
        const updated = await updateLocation(locationToEdit.id, data);
        message = `Location "${updated.name}" updated.`;
      } else {
        const created = await createLocation(data as CreateLocationInput);
        message = `Location "${created.name}" created.`;
      }
      toast.success(message);
      handleCloseFormModal();
      fetchLocations();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMsg =
        error.error?.message ||
        error.message ||
        `Failed to ${locationToEdit ? "update" : "create"} category.`;
      console.error("Form submission error:", error);
      toast.error(`Error: ${errorMsg}`);
      setIsSubmittingForm(false);
    }
  };

  return (
    <div>
      {/* Heading and Add Button (conditional on isAdmin) */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-gray-800">Locations</h1>
        {isAdmin && (
          <button
            onClick={() => handleOpenFormModal()}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add New Location
          </button>
        )}
      </div>

      {/* Loading / Error */}
      {isLoading && <LoadingSpinner />}
      {error && (
        <div className="rounded-md bg-red-100 p-4 text-red-700">
          Error: {error}
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Primary
                </th>
                {isAdmin && ( // Only show actions column to Admins
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {locations.length > 0 ? (
                locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {loc.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {loc.address || "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {loc.isPrimary && (
                        <span title="Primary Location">
                          <Star
                            className="mx-auto h-5 w-5 text-yellow-500"
                            aria-label="Primary Location"
                          />
                        </span>
                      )}
                    </td>

                    {isAdmin && (
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleOpenFormModal(loc)}
                          title="Edit"
                          className="text-indigo-600 hover:text-indigo-900 inline-block"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>

                        <button
                          onClick={() => handleDeleteClick(loc)}
                          title="Delete"
                          className="text-red-600 hover:text-red-900 inline-block"
                        >
                          <Trash className="h-5 w-5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={isAdmin ? 4 : 3}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals (conditional on isAdmin) */}
      {isAdmin && (
        <Modal
          isOpen={showFormModal}
          onClose={handleCloseFormModal}
          title={locationToEdit ? "Edit Location" : "Create New Location"}
        >
          <LocationForm
            initialData={locationToEdit}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmittingForm}
            submitButtonText={
              locationToEdit ? "Update Location" : "Create new Location"
            }
          />
        </Modal>
      )}

      {isAdmin && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Location"
          message={`Are you sure you want to delete the location "${locationToDelete?.name}"? Inventory levels at this location will be removed. This action cannot be undone.`}
        />
      )}
    </div>
  );
};

export default Locations;
