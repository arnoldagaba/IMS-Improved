import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as locationService from "@/api/services/location.service.ts";
import { CreateLocationInput, UpdateLocationInput } from "@/api/validators/location.validator.ts";

export const createLocationHandler = async (req: Request<{}, {}, CreateLocationInput>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const newLocation = await locationService.createLocation(req.body);
        res.status(StatusCodes.CREATED).json(newLocation);
    } catch (error) {
        if (error instanceof Error && error.message.includes("already exists")) {
            res.status(StatusCodes.CONFLICT).json({ message: error.message });
            return;
        }
        next(error);
    }
};

export const getAllLocationsHandler = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const locations = await locationService.findAllLocations();
        res.status(StatusCodes.OK).json(locations);
    } catch (error) {
        next(error);
    }
};

export const getLocationByIdHandler = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const locationId = req.params.id;
        const location = await locationService.findLocationById(locationId);

        if (!location) {
            res.status(StatusCodes.NOT_FOUND).json({ message: `Location with ID ${locationId} not found` });
            return;
        }
        res.status(StatusCodes.OK).json(location);
    } catch (error) {
        next(error);
    }
};

export const updateLocationHandler = async (req: Request<{ id: string }, {}, UpdateLocationInput>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const locationId = req.params.id;
        const updateData = req.body;

        const updatedLocation = await locationService.updateLocation(locationId, updateData);
        res.status(StatusCodes.OK).json(updatedLocation);
    } catch (error) {
        // Handle specific errors from service (Not Found, Conflict, Business Rule Violations)
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                res.status(StatusCodes.NOT_FOUND).json({ message: error.message });
                return;
            }
            if (error.message.includes("already exists") || error.message.includes("Cannot unset") || error.message.includes("primary first")) {
                res.status(StatusCodes.CONFLICT).json({ message: error.message }); // Or BAD_REQUEST depending on context
                return;
            }
        }
        next(error);
    }
};

export const deleteLocationHandler = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const locationId = req.params.id;
        await locationService.deleteLocation(locationId);
        res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                res.status(StatusCodes.NOT_FOUND).json({ message: error.message });
                return;
            }
            // Handle constraint errors or business rules preventing deletion
            if (error.message.includes("Cannot delete location") || error.message.includes("Cannot delete the primary location")) {
                res.status(StatusCodes.CONFLICT).json({ message: error.message }); // Or BAD_REQUEST
                return;
            }
        }
        next(error);
    }
};
