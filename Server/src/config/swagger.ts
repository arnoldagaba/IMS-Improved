import swaggerJsdoc from "swagger-jsdoc";
import env from "@/config/env.ts";

// Basic OpenAPI definition structure
const swaggerDefinition = {
    openapi: "3.0.0", // Use OpenAPI 3.0.0 spec
    info: {
        title: "Inventory Management System API",
        version: "1.0.0", // Initial version
        description:
            "API documentation for the Inventory Management System backend. " +
            "Provides endpoints for managing items, categories, locations, users, inventory levels, and stock transactions.",
        contact: {
            name: "API Support", // Replace with your name/team if desired
            // url: 'http://www.example.com/support',
            // email: 'support@example.com',
        },
        license: {
            name: "MIT", // Or your chosen license
            url: "https://opensource.org/licenses/MIT",
        },
    },
    servers: [
        {
            // Define the base URL for your API (adjust host/port/basePath as needed)
            url: `http://localhost:${env.PORT}/api/v1`,
            description: "Development server",
        },
        // Add other servers if you have staging/production environments
        // {
        //   url: 'https://your-production-api.com/api/v1',
        //   description: 'Production server',
        // },
    ],
    // --- Define Security Schemes (JWT Bearer) ---
    components: {
        securitySchemes: {
            BearerAuth: {
                // Can be any name, used later in 'security' tags
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT", // Optional, just documentation
                description: "Enter JWT token **_only_**", // Instructions for Swagger UI
            },
        },
        // We will define schemas using JSDoc comments in other files
        schemas: {}, // Keep this empty here, will be populated by swagger-jsdoc
    },
    // --- Define Security Globally (Optional) ---
    // If most/all endpoints require auth, you can set it globally:
    security: [
        {
            BearerAuth: [], // Requires the 'BearerAuth' scheme defined above
        },
    ],
};

// Options for swagger-jsdoc
const options: swaggerJsdoc.Options = {
    swaggerDefinition,
    // Path to the API docs files (routes, and potentially schema/validation files)
    apis: [
        "./src/routes/*.routes.ts", // Process all route files
        "./src/validation/*.validation.ts", // Process validation files for schema definitions
        // Add other files if you define schemas elsewhere (e.g., 'src/models/*.ts')
    ],
};

// Generate the Swagger specification
const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
