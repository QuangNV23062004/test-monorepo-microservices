import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Email', example: 'example@email.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({ description: 'Mật khẩu', example: 'Password!' })
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  password: string;
}
