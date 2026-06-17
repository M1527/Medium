import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class LoginUserDto {
  @ApiProperty()
  @IsEmail({}, { message: i18nValidationMessage('validation.EMAIL') })
  email!: string;

  @ApiProperty()
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  password!: string;
}
