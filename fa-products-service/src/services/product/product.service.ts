import { CosmosClient, SqlQuerySpec, Container } from "@azure/cosmos";
import { Product } from "../../types/product.types";
import { StockDefinition, ProductDefinition } from "./product-service.types";
import { CreateProductDto } from "../../dto/create-product.dto";
import { randomUUID } from "node:crypto";
import { getAppSetting } from "../app-config.service";

const databaseName = `products-db`;
const productContainerName = `products`;
const stockContainerName = `stocks`;

let cosmosKey: string;
let cosmosEndpoint: string;
let cosmosClient: CosmosClient;

async function getCosmosClient(): Promise<CosmosClient> {
    const key = await getAppSetting("COSMOS_KEY");
    const endpoint = await getAppSetting('COSMOS_ENDPOINT');

    if (key !== cosmosKey || endpoint !== cosmosEndpoint || !cosmosClient) {
        cosmosClient?.dispose();
        cosmosClient = new CosmosClient({ endpoint, key });
        cosmosKey = key;
        cosmosEndpoint = endpoint;
    }

    return cosmosClient;
}

async function getProductContainer(): Promise<Container> {
    const client = await getCosmosClient();

    return client.database(databaseName).container(productContainerName)
}

async function getStockContainer(): Promise<Container> {
    const client = await getCosmosClient();

    return client.database(databaseName).container(stockContainerName);
}

export async function getProductList(): Promise<Product[]> {
    const productResponse = await (await getProductContainer()).items.readAll().fetchAll();
    const stockResponse = await (await getStockContainer()).items.readAll().fetchAll();

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

export async function getProductById(productId: string): Promise<Product | null> {
    const productResponse = await (await getProductContainer()).item(productId, productId).read();
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

    const stockResponse = await (await getStockContainer()).items.query(stockQuery).fetchAll()
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

    await (await getProductContainer()).items.create<ProductDefinition>(productDef);

    if (productDto.count) {
        await (await getStockContainer()).items.create<StockDefinition>({
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
