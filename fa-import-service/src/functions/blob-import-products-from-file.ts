// import { app, InvocationContext } from "@azure/functions";
// import { StorageBlobHandler } from "@azure/functions/types/storage";
// import { BlobContainerName } from "../constants/container.constant";
//
// export async function importProductsFromFileHandler(blob: Buffer, context: InvocationContext): Promise<void> {
//     context.log(`Storage blob function processed blob "${context.triggerMetadata.name}" with size ${blob.length} bytes`);
// }
//
// app.storageBlob('blob-import-products-from-file', {
//     path: BlobContainerName.UPLOADED,
//     connection: "BLOB_STORAGE_CONNECTION_STRING",
//     handler: importProductsFromFileHandler as StorageBlobHandler
// });
