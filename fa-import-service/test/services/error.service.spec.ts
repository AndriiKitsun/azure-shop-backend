import { errorResponse } from "../../src/services/error/error.service";
import { HttpErrorType, HttpErrorResponse } from "../../src/services/error/error-service.types";
import { HttpResponseInit } from "@azure/functions";
import * as crypto from "crypto";

describe('ErrorService', () => {
    const idMock = "abd990fd-1f14-4978-812c-e9d7e57174ad";

    describe('errorResponse method', () => {
        beforeEach(() => {
            jest.spyOn(crypto, 'randomUUID').mockReturnValue(idMock);
            jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));
        });

        it('should return error response', () => {
            const expectedError: HttpErrorResponse = {
                id: idMock,
                timestamp: '2020-01-01T00:00:00.000Z',
                errors: [
                    {
                        type: HttpErrorType.VALIDATION_ERROR,
                        message: "error"
                    }
                ]
            }
            const expectedResponse: HttpResponseInit = {
                status: 400,
                jsonBody: expectedError
            }

            const response = errorResponse({
                status: 400,
                message: "error",
                type: HttpErrorType.VALIDATION_ERROR
            });

            expect(response).toStrictEqual(expectedResponse);
        });

        it('should return error response with fallback error type', () => {
            const expectedError: HttpErrorResponse = {
                id: idMock,
                timestamp: '2020-01-01T00:00:00.000Z',
                errors: [
                    {
                        type: HttpErrorType.UNKNOWN_ERROR,
                        message: "error"
                    }
                ]
            }
            const expectedResponse: HttpResponseInit = {
                status: 400,
                jsonBody: expectedError
            }

            const response = errorResponse({
                status: 400,
                message: "error",
            });

            expect(response).toStrictEqual(expectedResponse);
        });
    })
});
