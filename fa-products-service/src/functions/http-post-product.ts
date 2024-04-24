import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { constants } from "node:http2";
import { errorResponse, errorValidationResponse } from "../services/error/error.service";
import { CreateProductDto } from "../dto/create-product.dto";
import { validateDto } from "../services/dto/dto.service";
import { createProduct } from "../services/product/product.service";

export async function createProductHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    if (!request.body) {
        return errorResponse({
            status: constants.HTTP_STATUS_BAD_REQUEST,
            message: "Input body can't be empty"
        })
    }

    const body = await request.json() as CreateProductDto;
    const errors = await validateDto(CreateProductDto, body);

    if (errors.length) {
        return errorValidationResponse(errors);
    }

    const product = await createProduct(body);

    return { status: constants.HTTP_STATUS_CREATED, jsonBody: product }
}

app.post('http-post-product', {
    authLevel: 'anonymous',
    route: 'products',
    handler: createProductHandler
});

