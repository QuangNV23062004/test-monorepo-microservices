import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ReverifyDto {
  @ApiProperty({ description: 'Email', example: 'example@email.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;
}
