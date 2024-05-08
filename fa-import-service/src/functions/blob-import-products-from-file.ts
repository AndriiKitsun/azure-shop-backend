import { app, InvocationContext } from "@azure/functions";
import { StorageBlobHandler } from "@azure/functions/types/storage";

export async function importProductsFromFileHandler(blob: Buffer, context: InvocationContext): Promise<void> {
    context.log(`Storage blob function processed blob "${context.triggerMetadata.name}" with size ${blob.length} bytes`);
}

app.storageBlob('blob-import-products-from-file', {
    path: 'samples-workitems/{name}',
    connection: '',
    handler: importProductsFromFileHandler as StorageBlobHandler
});
