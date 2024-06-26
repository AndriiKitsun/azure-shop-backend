import { InvocationContext, app, StorageBlobHandler } from "@azure/functions";
import { BlobContainerName } from "../constants/container.constant";
import { BlobServiceClient } from "@azure/storage-blob";
import { parse } from "csv-parse/sync";
import { initServiceBus, sendMessage, closeServiceBus } from "../services/service-bus/service-bus.service";

export async function importProductsFromFileHandler(blob: Buffer, context: InvocationContext): Promise<void> {
    const blobName = context.triggerMetadata.blobTrigger as string;

    context.log(`Storage blob function processed blob "${blobName}" with size ${blob.length} bytes`);

    const products = parse(blob, {
        columns: (header: string[]) => {
            return header.map(column => column.trim());
        },
        trim: true,
        skipEmptyLines: true,
        cast: true
    }) as any[];

    initServiceBus();

    for (const product of products) {
        try {
            await sendMessage(product);
        } catch (error) {
            context.error("Error occurred during sending message to ServiceBus", error)
        }
    }

    await closeServiceBus();

    await moveParsedFile(blob, blobName);
}

async function moveParsedFile(blob: Buffer, blobName: string): Promise<void> {
    const fileName = blobName.split(`${BlobContainerName.UPLOADED}/`)[1];
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AzureWebJobsStorage);

    const uploadedContainer = blobServiceClient.getContainerClient(BlobContainerName.UPLOADED);
    const parsedContainer = blobServiceClient.getContainerClient(BlobContainerName.PARSED);

    const uploadedBlockBlob = uploadedContainer.getBlockBlobClient(fileName);
    const parsedBlockBlob = parsedContainer.getBlockBlobClient(fileName);

    await parsedBlockBlob.uploadData(blob);
    await uploadedBlockBlob.delete({
        deleteSnapshots: 'include'
    });
}

app.storageBlob('blob-import-products-from-file', {
    path: BlobContainerName.UPLOADED,
    connection: "AzureWebJobsStorage",
    handler: importProductsFromFileHandler as StorageBlobHandler
});
