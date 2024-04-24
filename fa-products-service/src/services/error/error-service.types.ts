export interface HttpErrorArgs {
    status: number;
    message: string;
    type?: HttpErrorType;
}

export enum HttpErrorType {
    VALIDATION_ERROR = "ValidationError",
    UNKNOWN_ERROR = "UnknownError"
}

export interface HttpErrorResponse {
    id: string;
    timestamp: string;
    errors: HttpError[];
}

export interface HttpError {
    message: string;
    type: HttpErrorType;
}
