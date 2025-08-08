import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsEmail, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ description: 'Tên người dùng', example: 'John Doe' })
  @IsString({ message: 'Tên phải là chuỗi' })
  name?: string;

  @ApiProperty({ description: 'Ngày sinh', example: '2000-01-01' })
  @IsISO8601({}, { message: 'Ngày sinh phải là định dạng ISO8601' })
  birthDate?: string;

  @ApiProperty({ description: 'Sở thích', example: 'Đọc sách' })
  @IsString({ message: 'Sở thích phải là chuỗi' })
  hobby?: string;

  @ApiProperty({ description: 'Email', example: 'example@email.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @ApiProperty({ description: 'Mật khẩu', example: 'Password123!' })
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  password?: string;

  @ApiProperty({ description: 'Mật khẩu cũ', example: 'Password123!' })
  @IsString({ message: 'Mật khẩu cũ phải là chuỗi' })
  oldPassword?: string;

  @ApiProperty({ description: 'Vai trò', example: 'admin' })
  @IsString({ message: 'Vai trò phải là chuỗi' })
  role?: string;
}
