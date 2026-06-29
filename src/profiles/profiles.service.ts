import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findByUsername(username: string, currentUserId?: number) {
    const profile = await this.usersRepository.findOne({
      where: { username },
      relations: {
        followers: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('User not found');
    }

    return this.buildProfileResponse(profile, currentUserId);
  }

  async follow(currentUserId: number, username: string) {
    const currentUser = await this.usersRepository.findOne({
      where: { id: currentUserId },
      relations: {
        following: true,
      },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const targetUser = await this.usersRepository.findOne({
      where: { username },
      relations: {
        followers: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (currentUser.id === targetUser.id) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const alreadyFollowing = currentUser.following.some(
      (user) => user.id === targetUser.id,
    );

    if (!alreadyFollowing) {
      currentUser.following.push(targetUser);
      await this.usersRepository.save(currentUser);
    }

    return this.findByUsername(username, currentUserId);
  }

  async unfollow(currentUserId: number, username: string) {
    const currentUser = await this.usersRepository.findOne({
      where: { id: currentUserId },
      relations: {
        following: true,
      },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const targetUser = await this.usersRepository.findOne({
      where: { username },
      relations: {
        followers: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    currentUser.following = currentUser.following.filter(
      (user) => user.id !== targetUser.id,
    );

    await this.usersRepository.save(currentUser);

    return this.findByUsername(username, currentUserId);
  }

  private buildProfileResponse(profile: User, currentUserId?: number) {
    const { password, ...user } = profile;

    return {
      ...user,
      following:
        currentUserId !== undefined
          ? profile.followers?.some((user) => user.id === currentUserId) ?? false
          : false,
    };
  }
}