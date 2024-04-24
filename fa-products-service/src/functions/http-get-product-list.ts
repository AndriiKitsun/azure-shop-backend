import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getProductList } from "../services/product/product.service";

export async function getProductListHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const productList = await getProductList();

    return { jsonBody: productList };
}

app.get('http-get-product-list', {
    authLevel: 'anonymous',
    route: 'products',
    handler: getProductListHandler
});

