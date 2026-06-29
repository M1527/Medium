import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { plainToInstance } from 'class-transformer';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly i18n: I18nService,
  ) {}

  async findByUsername(username: string, currentUserId?: number) {
    const profile = await this.usersRepository.findOne({
      where: { username },
      relations: {
        followers: true,
      },
    });

    if (!profile) {
      throw new NotFoundException(this.translate('users.errors.notFound'));
    }

    return plainToInstance(
      ProfileResponseDto,
      {
        ...profile,
        currentUserId,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  async follow(currentUserId: number, username: string) {
    const currentUser = await this.usersRepository.findOne({
      where: { id: currentUserId },
      relations: {
        following: true,
      },
    });

    if (!currentUser) {
      throw new NotFoundException(this.translate('users.errors.notFound'));
    }

    const targetUser = await this.usersRepository.findOne({
      where: { username },
      relations: {
        followers: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException(this.translate('users.errors.notFound'));
    }

    if (currentUser.id === targetUser.id) {
      throw new BadRequestException(
        this.translate('profiles.errors.cannotFollowYourself'),
      );
    }

    const isAlreadyFollowing = currentUser.following.some(
      (user) => user.id === targetUser.id,
    );

    if (!isAlreadyFollowing) {
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
      throw new NotFoundException(this.translate('users.errors.notFound'));
    }

    const targetUser = await this.usersRepository.findOne({
      where: { username },
      relations: {
        followers: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException(this.translate('users.errors.notFound'));
    }

    currentUser.following = currentUser.following.filter(
      (user) => user.id !== targetUser.id,
    );

    await this.usersRepository.save(currentUser);

    return this.findByUsername(username, currentUserId);
  }

  private translate(key: string): string {
    return this.i18n.t(key, { lang: I18nContext.current()?.lang });
  }
}
