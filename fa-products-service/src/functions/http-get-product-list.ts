import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { productListMock } from "../mocks/product.mocks";

export async function getProductList(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    return {
        jsonBody: productListMock
    };
}

app.get('http-get-product-list', {
    authLevel: 'anonymous',
    route: 'products',
    handler: getProductList
});

