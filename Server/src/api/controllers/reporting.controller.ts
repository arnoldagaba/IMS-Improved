import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as reportingService from "@/api/services/reporting.service.ts";
import logger from "@/config/logger.ts";
import { DateRangeQueryInput } from "@/api/validators/reporting.validator.ts";

// Handler for Inventory Value Report
export const getInventoryValueReportHandler = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const report = await reportingService.generateInventoryValueReport();
        // Note: Need to handle Decimal serialization for JSON response
        // JSON doesn't natively support Decimal, so convert to string or number.
        // Converting to string preserves precision.
        const reportForJson = {
            ...report,
            totalValue: report.totalValue.toString(), // Convert Decimal to string
            details: report.details.map((item) => ({
                ...item,
                costPrice: item.costPrice?.toString(), // Convert Decimal to string
                lineValue: item.lineValue.toString(), // Convert Decimal to string
            })),
        };

        res.status(StatusCodes.OK).json(reportForJson);
    } catch (error) {
        logger.error({ error }, "Failed to handle inventory value report request");
        next(error);
    }
};

// Handler for Stock Movement Summary Report
export const getStockMovementReportHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // --- Access the validated/transformed query from req.validatedData ---
        // Use type assertion here, as validatedData properties are 'any' in the augmented type
        const queryParams = req.validatedData?.query as DateRangeQueryInput;

        // Add a check in case validatedData is somehow missing (shouldn't happen)
        if (!queryParams) {
            logger.error("Validated query data missing from request object after validation middleware.");
            next(new Error("Internal processing error: Missing validated data."));
            return;
        }

        const report = await reportingService.generateStockMovementReport(queryParams);
        res.status(StatusCodes.OK).json(report);
    } catch (error) {
        logger.error({ error, query: req.query }, "Failed to handle stock movement report request");
        next(error);
    }
};
