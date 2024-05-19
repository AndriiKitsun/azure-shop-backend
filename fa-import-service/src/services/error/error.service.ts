import { randomUUID } from "node:crypto";
import { HttpResponseInit } from "@azure/functions";
import { HttpErrorResponse, HttpErrorArgs, HttpErrorType } from "./error-service.types";

export function errorResponse(error: HttpErrorArgs): HttpResponseInit {
    const body: HttpErrorResponse = {
        id: randomUUID(),
        timestamp: new Date().toJSON(),
        errors: [
            {
                type: error.type ?? HttpErrorType.UNKNOWN_ERROR,
                message: error.message
            }
        ]
    }

    return {
        status: error.status,
        jsonBody: body
    }
}
