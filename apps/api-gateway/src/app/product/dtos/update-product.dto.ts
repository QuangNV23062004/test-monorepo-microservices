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
  @ApiProperty({ description: 'Product name', example: 'Product123' })
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty({ description: 'Product images' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images: string[];

  @ApiProperty({ description: 'Product quantity', example: 20 })
  @IsNumber()
  @IsInt({ message: 'Quantity must be integer' })
  @IsOptional()
  @IsPositive({ message: 'Quantity must be positive' })
  quantity: number;

  @ApiProperty({ description: 'Product price', example: 5000 })
  @IsNumber()
  @IsPositive({ message: 'Price must be positive' })
  @IsOptional()
  price: number;

  @ApiProperty({
    description: 'Product current price (should be lower than price)',
    example: 4900,
  })
  @IsNumber()
  @IsPositive({ message: 'Current price must be positive' })
  @IsOptional()
  currentPrice: number;
}
