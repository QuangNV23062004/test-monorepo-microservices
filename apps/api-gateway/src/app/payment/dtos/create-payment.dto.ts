import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  ValidateNested,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';

// Sub DTO for each product in the list
export class ProductItemDto {
  @ApiProperty({ description: 'ID của sản phẩm', example: 'abc123' })
  @IsString({ message: 'productId phải là chuỗi' })
  productId: string;

  @ApiProperty({ description: 'Số lượng sản phẩm', example: 2 })
  @IsNumber({}, { message: 'quantity phải là số' })
  @Min(1, { message: 'quantity phải >= 1' })
  quantity: number;
}

// Main DTO for the payment creation
export class CreatePaymentDto {
  @ApiProperty({
    description: 'Danh sách sản phẩm',
    type: [ProductItemDto],
  })
  @IsArray({ message: 'productList phải là mảng' })
  @ValidateNested({ each: true })
  @Type(() => ProductItemDto)
  productList: ProductItemDto[];
}
