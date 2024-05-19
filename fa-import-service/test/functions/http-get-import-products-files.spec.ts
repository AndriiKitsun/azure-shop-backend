import { HttpRequest, InvocationContext, HttpResponseInit } from "@azure/functions";
import { getImportProductsFilesHandler } from "../../src/functions/http-get-import-products-files";
import * as errorService from "../../src/services/error/error.service";

describe('http-get-import-products-files function', () => {
    describe('getImportProductsFilesHandler method', () => {
        it("should return error response when 'name' query parameter is absent", async () => {
            const requestMock = new HttpRequest({
                url: "http://localhost:8080",
                method: 'GET'
            });
            const contextMock = new InvocationContext();
            const errorMock: HttpResponseInit = {
                status: 401,
                jsonBody: "someError"
            };

            jest.spyOn(errorService, "errorResponse").mockReturnValue(errorMock);

            const response = await getImportProductsFilesHandler(requestMock, contextMock);

            expect(errorService.errorResponse).toHaveBeenCalled();
            expect(response).toStrictEqual(errorMock);
        });


        it('should return SAS token for requested file', async () => {
            const requestMock = new HttpRequest({
                url: "http://localhost:8080",
                method: 'GET',
                query: {
                    name: "file.csv"
                }
            });
            const contextMock = new InvocationContext();

            jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));
            process.env.AzureWebJobsStorage = 'UseDevelopmentStorage=true';

            const response = await getImportProductsFilesHandler(requestMock, contextMock);

            expect(response).toStrictEqual({
                jsonBody: "http://127.0.0.1:10000/devstoreaccount1/uploaded/file.csv?sv=2023-11-03&st=2020-01-01T00%3A00%3A00Z&se=2020-01-01T00%3A10%3A00Z&sr=b&sp=rw&sig=yL1ObhJp3jv%2BrhFfUu55d%2F129XOlUtn1zDO%2FK2Y5kFE%3D"
            })
        });
    });
});
