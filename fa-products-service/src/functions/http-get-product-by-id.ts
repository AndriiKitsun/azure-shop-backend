import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { constants } from "node:http2"
import { randomUUID } from "node:crypto";
import { getProduct } from "../services/product/product.service";

export async function getProductById(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const productId = request.params.productId;
    const product = await getProduct(productId);

    if (!product) {
        return {
            status: constants.HTTP_STATUS_NOT_FOUND,
            jsonBody: {
                errors: [
                    {
                        id: randomUUID(),
                        message: `Product with id '${productId}' not found!`
                    }
                ]
            }
        }
    }

    return { jsonBody: product };
}

app.get('http-get-product-by-id', {
    authLevel: 'anonymous',
    route: 'products/{productId}',
    handler: getProductById
});
