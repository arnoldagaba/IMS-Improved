import { JSX } from "react";

export const LoadingSpinner = (): JSX.Element => (
    <div className="flex h-32 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600"></div>
    </div>
);
