import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class UpdateProductDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Product name', example: 'Product123' })
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty({ description: 'Product images' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images: string[];

  @ApiProperty({ description: 'Product name', example: 'Product123' })
  @IsNumber()
  @IsInt({ message: 'Quantity must be integer' })
  @IsOptional()
  @IsPositive({ message: 'Quantity must be positive' })
  quantity: number;

  @IsNumber()
  @IsPositive({ message: 'Price must be positive' })
  @IsOptional()
  price: number;

  @IsNumber()
  @IsPositive({ message: 'Current price must be positive' })
  @IsOptional()
  currentPrice: number;
}
