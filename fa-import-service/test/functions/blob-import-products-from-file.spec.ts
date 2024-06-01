import { InvocationContext } from "@azure/functions";
import { importProductsFromFileHandler } from "../../src/functions/blob-import-products-from-file";
import { BlobServiceClient } from "@azure/storage-blob";
import { BlobContainerName } from "../../src/constants/container.constant";
import * as serviceBusService from "../../src/services/service-bus/service-bus.service";

jest.mock('@azure/storage-blob', () => ({
    BlobServiceClient: {
        fromConnectionString: jest.fn().mockReturnValue({
            getContainerClient: jest.fn().mockReturnValue({
                getBlockBlobClient: jest.fn().mockReturnValue({
                    uploadData: jest.fn(),
                    delete: jest.fn()
                }),
            }),
        }),
    },
}));

describe('blob-import-products-from-file function', () => {

    beforeEach(() => {
        jest.spyOn(serviceBusService, 'initServiceBus').mockImplementation();
        jest.spyOn(serviceBusService, 'sendMessage').mockImplementation();
        jest.spyOn(serviceBusService, 'closeServiceBus').mockImplementation();
        jest.clearAllMocks();
    });


    describe('importProductsFromFileHandler method', () => {
        const csvMock = [
            "title,description,price,count",
            "test knife,test descr,12,2"
        ].join('\n');
        const blobNameMock = "uploaded/file.csv";
        const blob = Buffer.from(csvMock);
        const contextMock = new InvocationContext({
            triggerMetadata: {
                blobTrigger: blobNameMock
            }
        });

        it('should initialize service bus client', async () => {
            await importProductsFromFileHandler(blob, contextMock);

            expect(serviceBusService.initServiceBus).toHaveBeenCalled();
        });

        it('should close service bus client', async () => {
            await importProductsFromFileHandler(blob, contextMock);

            expect(serviceBusService.closeServiceBus).toHaveBeenCalled();
        });

        it('should send every product to service bus', async () => {
            const expectedPayload = { "count": 2, "description": "test descr", "price": 12, "title": "test knife" };

            await importProductsFromFileHandler(blob, contextMock);

            expect(serviceBusService.sendMessage).toHaveBeenCalledTimes(1);
            expect(serviceBusService.sendMessage).toHaveBeenLastCalledWith(expectedPayload);
        });

        it('should log an error when the message was not sent', async () => {
            jest.spyOn(contextMock, 'error');
            jest.spyOn(serviceBusService, 'sendMessage').mockRejectedValueOnce(new Error());

            await importProductsFromFileHandler(blob, contextMock);

            expect(contextMock.error).toHaveBeenCalled();
        });


        it("should move file from 'uploaded' container to 'parsed'", async () => {
            const blobServiceClient = BlobServiceClient.fromConnectionString('123');

            const uploadedContainer = blobServiceClient.getContainerClient(BlobContainerName.UPLOADED);
            const parsedContainer = blobServiceClient.getContainerClient(BlobContainerName.PARSED);

            const uploadedBlockBlob = uploadedContainer.getBlockBlobClient('fileName');
            const parsedBlockBlob = parsedContainer.getBlockBlobClient('fileName');

            await importProductsFromFileHandler(blob, contextMock);

            expect(uploadedBlockBlob.uploadData).toHaveBeenCalledWith(blob);
            expect(parsedBlockBlob.delete).toHaveBeenCalledWith({
                deleteSnapshots: 'include'
            });
        });
    });

});
