import { JSX } from "react";

const Dashboard = (): JSX.Element => {
    return (
        <div>
            <h1 className="text-3xl font-semibold text-gray-800">Dashboard</h1>
            <p className="mt-2 text-gray-600">Welcome to the Inventory Management System.</p>
            {/* Add dashboard widgets here */}
        </div>
    );
};

export default Dashboard;