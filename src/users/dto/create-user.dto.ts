import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail({}, { message: i18nValidationMessage('validation.EMAIL') })
  email!: string;

  @ApiProperty()
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  username!: string;

  @ApiProperty()
  @MinLength(6, { message: i18nValidationMessage('validation.MIN_LENGTH') })
  password!: string;
}
