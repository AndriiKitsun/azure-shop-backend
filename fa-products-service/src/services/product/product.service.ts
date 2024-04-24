import { CosmosClient, SqlQuerySpec } from "@azure/cosmos";
import { Product } from "../../types/product.types";
import { StockDefinition, ProductDefinition } from "./product-service.types";
import { CreateProductDto } from "../../dto/create-product.dto";
import { randomUUID } from "node:crypto";

const key = process.env.COSMOS_KEY!;
const endpoint = process.env.COSMOS_ENDPOINT!;

const databaseName = `products-db`;
const productContainerName = `products`;
const stockContainerName = `stocks`;

const cosmosClient = new CosmosClient({ endpoint, key });

const database = cosmosClient.database(databaseName);
const productContainer = database.container(productContainerName);
const stockContainer = database.container(stockContainerName);

export async function getProducts(): Promise<Product[]> {
    const productResponse = await productContainer.items.readAll().fetchAll();
    const stockResponse = await stockContainer.items.readAll().fetchAll();

    const products = productResponse.resources as ProductDefinition[];
    const stocks = stockResponse.resources as StockDefinition[];

    return products.map(product => {
        const stock = stocks.find(stock => stock.product_id === product.id);

        return {
            id: product.id,
            title: product.title,
            description: product.description,
            price: product.price,
            count: stock?.count ?? 0
        }
    });
}

export async function getProduct(productId: string): Promise<Product | null> {
    const productResponse = await productContainer.item(productId, productId).read();
    const product = productResponse.resource as ProductDefinition;

    if (!product) {
        return null;
    }

    const stockQuery: SqlQuerySpec = {
        query: "SELECT * FROM stocks s WHERE s.product_id = @productId",
        parameters: [
            {
                name: "@productId",
                value: product.id
            }
        ]
    }

    const stockResponse = await stockContainer.items.query(stockQuery).fetchAll()
    const stocks = stockResponse.resources as StockDefinition[];

    return {
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        count: stocks?.[0]?.count ?? 0
    }
}

export async function createProduct(productDto: CreateProductDto): Promise<Product> {
    const productDef: ProductDefinition = {
        id: randomUUID(),
        title: productDto.title,
        description: productDto.description,
        price: productDto.price
    };

    await productContainer.items.create<ProductDefinition>(productDef);

    if (productDto.count) {
        await stockContainer.items.create<StockDefinition>({
            id: randomUUID(),
            product_id: productDef.id,
            count: productDto.count
        });
    }

    return {
        ...productDef,
        count: productDto.count
    };
}
