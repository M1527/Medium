import { Exclude, Expose, Transform } from 'class-transformer';

import { User } from '../../users/entities/user.entity';

export class ProfileResponseDto {
  @Expose()
  id!: number;

  @Expose()
  email!: string;

  @Expose()
  username!: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Exclude()
  password!: string;

  @Exclude()
  followers?: User[];

  @Exclude()
  currentUserId?: number;

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.currentUserId) {
      return false;
    }

    return (
      obj.followers?.some(
        (follower: User) => follower.id === obj.currentUserId,
      ) ?? false
    );
  })
  following!: boolean;
}