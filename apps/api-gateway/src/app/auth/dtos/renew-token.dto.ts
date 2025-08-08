import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RenewTokensDto {
  @ApiProperty({ description: 'refreshToken', example: 'ey...' })
  @IsString({ message: 'refreshToken phải là chuỗi' })
  refreshToken: string;
}
