import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PASSWORD_MIN_LENGTH } from '../../common/constants/app.constants';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail({}, { message: i18nValidationMessage('validation.EMAIL') })
  email!: string;

  @ApiProperty()
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  username!: string;

  @ApiProperty()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: i18nValidationMessage('validation.MIN_LENGTH'),
  })
  password!: string;
}
