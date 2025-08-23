import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
  IsPositive,
  IsInt,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: 'Product name', example: 'Product123' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Product images' })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({ description: 'Product quantity', example: 10 })
  @IsNumber()
  @IsInt({ message: 'Quantity must be integer' })
  @IsPositive({ message: 'Quantity must be positive' })
  quantity: number;

  @ApiProperty({ description: 'Product price', example: 100000 })
  @IsNumber()
  @IsPositive({ message: 'Price must be positive' })
  price: number;

  @ApiProperty({ description: 'Product current price', example: 99000 })
  @IsNumber()
  @IsPositive({ message: 'Current price must be positive' })
  currentPrice: number;
}
