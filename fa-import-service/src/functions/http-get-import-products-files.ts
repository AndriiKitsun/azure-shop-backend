import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobServiceClient, BlobSASSignatureValues, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from "@azure/storage-blob";
import { errorResponse } from "../services/error/error.service";
import { HttpErrorType } from "../services/error/error-service.types";
import { constants } from "node:http2";
import { BlobContainerName } from "../constants/container.constant";

export async function getImportProductsFilesHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const fileName = request.query.get('name');

    if (!fileName) {
        return errorResponse({
            type: HttpErrorType.VALIDATION_ERROR,
            message: `Query parameter "name" is required`,
            status: constants.HTTP_STATUS_BAD_REQUEST
        });
    }

    const sasToken = getSasToken(fileName);

    return { jsonBody: sasToken };
}

function getSasToken(blobName: string): unknown {
    const startsOn = new Date();
    const expiresOn = new Date(startsOn.valueOf() + 10 * 60_000);

    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.BLOB_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(BlobContainerName.UPLOADED);
    const blobBlockClient = containerClient.getBlockBlobClient(blobName);
    const { accountName, credential } = containerClient;

    const sasSignature: BlobSASSignatureValues = {
        containerName: BlobContainerName.UPLOADED,
        blobName,
        permissions: BlobSASPermissions.parse('rw'),
        startsOn,
        expiresOn
    };
    const credentials = new StorageSharedKeyCredential(accountName, (credential as StorageSharedKeyCredential).accountName);
    const token = generateBlobSASQueryParameters(sasSignature, credentials).toString();

    return `${blobBlockClient.url}?${token}`;
}

app.get('http-get-import-products-files', {
    authLevel: 'anonymous',
    route: "import",
    handler: getImportProductsFilesHandler
});
