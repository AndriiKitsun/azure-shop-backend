import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { productListMock } from "../mocks/product.mocks";
import { constants } from "node:http2"
import { randomUUID } from "node:crypto";

export async function getProductById(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const productId = request.params.productId;
    const product = productListMock.find(product => product.id === productId);

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
