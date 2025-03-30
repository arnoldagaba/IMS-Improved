import { useState, FormEvent, useEffect, JSX } from "react";
import { Location } from "@/types/inventory";
import { toast } from "react-toastify";

interface LocationFormProps {
  initialData?: Location | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => Promise<void>; // Use specific types later
  isSubmitting: boolean;
  submitButtonText?: string;
}

const LocationForm = ({
  initialData = null,
  onSubmit,
  isSubmitting,
  submitButtonText = "Save Location",
}: LocationFormProps): JSX.Element => {
  const [name, setName] = useState(initialData?.name || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [isPrimary, setIsPrimary] = useState(initialData?.isPrimary || false);

  useEffect(() => {
    setName(initialData?.name || "");
    setAddress(initialData?.address || "");
    setIsPrimary(initialData?.isPrimary || false);
  }, [initialData]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.warn("Location name is required.");
      return;
    }
    const formData = { name, address: address || null, isPrimary };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let submitData: any = formData;
    if (initialData) {
      submitData = {};
      if (formData.name !== initialData.name) submitData.name = formData.name;
      if (formData.address !== initialData.address)
        submitData.address = formData.address;
      // Only include isPrimary if it actually changes from the initial state
      if (formData.isPrimary !== initialData.isPrimary)
        submitData.isPrimary = formData.isPrimary;

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
          htmlFor="loc-name"
          className="block text-sm font-medium text-gray-700"
        >
          Name <span className="text-red-600">*</span>
        </label>

        <input
          type="text"
          id="loc-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isSubmitting}
          className="mt-1 block w-full rounded-md p-2 border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      {/* Address */}
      <div>
        <label
          htmlFor="loc-address"
          className="block text-sm font-medium text-gray-700"
        >
          Address
        </label>

        <textarea
          id="loc-address"
          rows={3}
          value={address ?? ""}
          onChange={(e) => setAddress(e.target.value)}
          disabled={isSubmitting}
          className="mt-1 block w-full rounded-md p-2 border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      {/* Is Primary */}
      <div className="flex items-center">
        <input
          id="loc-isPrimary"
          type="checkbox"
          checked={isPrimary}
          onChange={(e) => setIsPrimary(e.target.checked)}
          disabled={isSubmitting}
          className="h-4 w-4 rounded border border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />

        <label
          htmlFor="loc-isPrimary"
          className="ml-2 block text-sm text-gray-900"
        >
          Set as Primary Location
        </label>
      </div>

      {/* Submit Button */}
      <div className="pt-5 text-right">
        {/* ... Submit button same as CategoryForm ... */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`inline-flex ... ${
            isSubmitting ? "cursor-not-allowed opacity-50" : ""
          }`}
        >
          {isSubmitting ? "Saving..." : submitButtonText}
        </button>
      </div>
    </form>
  );
};

export default LocationForm;
