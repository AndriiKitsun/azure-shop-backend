import { Initializable } from "../common/initializable";
import { Product } from "../types/product.types";
import { IsNotEmpty, IsString, IsNumber, IsOptional } from "class-validator";

export class CreateProductDto extends Initializable implements Omit<Product, 'id'> {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description: string;

    @IsNotEmpty()
    @IsNumber()
    price: number;

    @IsOptional()
    @IsNumber()
    count: number;
}
