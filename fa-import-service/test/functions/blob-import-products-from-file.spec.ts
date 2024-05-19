import { InvocationContext } from "@azure/functions";
import { importProductsFromFileHandler } from "../../src/functions/blob-import-products-from-file";
import { BlobServiceClient } from "@azure/storage-blob";
import { BlobContainerName } from "../../src/constants/container.constant";

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

        it('should log every parsed record', async () => {
            jest.spyOn(contextMock, 'log');

            await importProductsFromFileHandler(blob, contextMock);

            expect(contextMock.log).toHaveBeenCalledTimes(2);
            expect(contextMock.log).toHaveBeenLastCalledWith(`Imported product item #1: {"title":"test knife","description":"test descr","price":"12","count":"2"}`);
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
