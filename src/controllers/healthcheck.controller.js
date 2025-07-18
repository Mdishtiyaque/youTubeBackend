import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    const startTime = process.hrtime(); // Start timer

    try {
        const healthCheck = {
            uptime: process.uptime(),
            message: 'ok',
            timestamp: Date.now()
        };

        const diff = process.hrtime(startTime); // End timer
        const responseTimeInMs = diff[0] * 1000 + diff[1] / 1e6;

        healthCheck.responseTime = `${responseTimeInMs.toFixed(2)} ms`;

        return res.status(200).json(
            new ApiResponse(
                200,
                healthCheck,
                "Health is good"
            )
        );
    } catch (error) {
        console.error("Error in health check:", error);
        throw new ApiError(
            503,
            "Error during health check"
        );
    } 
})



export {
    healthcheck
    }
    