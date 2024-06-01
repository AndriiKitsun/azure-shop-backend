import { InvocationContext } from "@azure/functions";
import { importProductHandler } from "../../src/functions/service-bus-import-product";
import * as productService from "../../src/services/product/product.service";
import { Product } from "../../src/types/product.types";

jest.mock('@azure/app-configuration');

describe('service-bus-import-product function', () => {
    const contextMock = new InvocationContext();
    const wrongProductDto = { "title": "", "description": "mock description", "price": 300, "count": 2 };
    const productDto = { "title": "prName", "description": "description2", "price": 300, "count": 2 };

    const productMock: Product = {
        id: "productId",
        title: "prName",
        description: "description2",
        price: 300,
        count: 2
    }

    describe('importProductHandler method', () => {

        beforeEach(() => {
            jest.spyOn(productService, 'createProduct').mockResolvedValue(productMock);
        });

        it('should log error in case validation error', async () => {
            jest.spyOn(contextMock, 'error');

            await importProductHandler(wrongProductDto, contextMock);

            expect(contextMock.error).toHaveBeenCalled();
            expect(productService.createProduct).not.toHaveBeenCalled();
        });

        it('should create product', async () => {
            await importProductHandler(productDto, contextMock);

            expect(productService.createProduct).toHaveBeenCalled();
        });

    })
});
