import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entitiy';

export class UserResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static createFromUser(user: User): UserResponseDto {
    const response = new UserResponseDto();
    response.id = user.id;
    response.email = user.email;
    response.username = user.username;
    response.createdAt = user.createdAt;
    response.updatedAt = user.updatedAt;

    return response;
  }
}
