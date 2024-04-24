import { ItemDefinition } from "@azure/cosmos";

export interface ProductDefinition extends ItemDefinition {
    id: string;
    title: string;
    description: string;
    price: number;
}

export interface StockDefinition extends ItemDefinition {
    product_id: string;
    count: number;
}
