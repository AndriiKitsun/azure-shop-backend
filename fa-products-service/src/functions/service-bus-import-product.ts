import { app, InvocationContext } from "@azure/functions";
import { CreateProductDto } from "../dto/create-product.dto";
import { validateDto } from "../services/dto/dto.service";
import { createProduct } from "../services/product/product.service";

export async function importProductHandler(message: unknown, context: InvocationContext): Promise<void> {
    context.log('Service bus queue function processed message:', message);

    const errors = await validateDto(CreateProductDto, message);

    if (errors.length) {
        context.error(`Some errors occurs during message validation:`, errors);
        return;
    }

    const product = await createProduct(message as CreateProductDto);

    context.log(`Product with id "${product.id}" has been created`);
}

app.serviceBusQueue('service-bus-import-product', {
    connection: 'SERVICE_BUS_CONNECTION_STRING',
    queueName: process.env.IMPORT_PRODUCT_QUEUE_NAME,
    handler: importProductHandler
});
