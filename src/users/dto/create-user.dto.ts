import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { PASSWORD_MIN_LENGTH } from '../../common/constants/app.constants';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsNotEmpty()
  username!: string;

  @ApiProperty()
  @MinLength(PASSWORD_MIN_LENGTH)
  password!: string;
}
