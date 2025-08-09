import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsISO8601, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @ApiProperty({ description: 'Email', example: 'example@email.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({ description: 'Tên người dùng', example: 'John Doe' })
  @IsString({ message: 'Tên phải là chuỗi' })
  name: string;

  @ApiProperty({ description: 'Ngày sinh', example: '2000-01-01' })
  @IsISO8601({}, { message: 'Ngày sinh phải là định dạng ISO8601' })
  @Transform(({ value }) => new Date(value))
  birthDate: string;

  @ApiProperty({ description: 'Sở thích', example: 'Đọc sách' })
  @IsString({ message: 'Sở thích phải là chuỗi' })
  hobby: string;

  @ApiProperty({ description: 'Mật khẩu', example: 'Password!' })
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  password: string;
}
