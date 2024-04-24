import { randomUUID } from "node:crypto";
import { HttpResponseInit } from "@azure/functions";
import { HttpErrorResponse, HttpErrorArgs, HttpErrorType } from "./error-service.types";
import { ValidationError } from "class-validator/types/validation/ValidationError";
import { constants } from "node:http2";

export function errorResponse(error: HttpErrorArgs): HttpResponseInit {
    const body: HttpErrorResponse = {
        id: randomUUID(),
        timestamp: new Date().toJSON(),
        errors: [
            {
                type: HttpErrorType.UNKNOWN_ERROR,
                message: error.message
            }
        ]
    }

    return {
        status: error.status,
        jsonBody: body
    }
}

export function errorValidationResponse(errors: ValidationError[]): HttpResponseInit {
    const body: HttpErrorResponse = {
        id: randomUUID(),
        timestamp: new Date().toJSON(),
        errors: errors.map(error => {
            return {
                type: HttpErrorType.VALIDATION_ERROR,
                message: error.toString(false, false, undefined, true)
            }
        })
    }

    return {
        status: constants.HTTP_STATUS_BAD_REQUEST,
        jsonBody: body
    }
}

