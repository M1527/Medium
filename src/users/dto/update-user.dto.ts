import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail({}, { message: i18nValidationMessage('validation.EMAIL') })
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.STRING') })
  username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @MinLength(6, { message: i18nValidationMessage('validation.MIN_LENGTH') })
  password?: string;
}
