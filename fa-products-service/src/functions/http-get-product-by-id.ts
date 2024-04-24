import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { constants } from "node:http2"
import { errorResponse } from "../services/error/error.service";
import { getProductById } from "../services/product/product.service";

export async function getProductByIdHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const productId = request.params.productId;
    const product = await getProductById(productId);

    if (!product) {
        return errorResponse({
            status: constants.HTTP_STATUS_NOT_FOUND,
            message: `Product with id '${productId}' not found!`
        });
    }

    return { jsonBody: product };
}

app.get('http-get-product-by-id', {
    authLevel: 'anonymous',
    route: 'products/{productId}',
    handler: getProductByIdHandler
});
