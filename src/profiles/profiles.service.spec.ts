import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { User } from '../users/entities/user.entity';
import { ProfilesService } from './profiles.service';

describe('ProfilesService', () => {
  let service: ProfilesService;
  let usersRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let i18nService: {
    t: jest.Mock;
  };

  const user = {
    id: 1,
    email: 'user@example.com',
    username: 'user',
    password: 'hashed-password',
    followers: [],
    following: [],
  } as unknown as User;

  beforeEach(async () => {
    usersRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    i18nService = {
      t: jest.fn((key: string) => key),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
        {
          provide: I18nService,
          useValue: i18nService,
        },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw translated not found error when profile does not exist', async () => {
    usersRepository.findOne.mockResolvedValue(null);

    await expect(service.findByUsername('missing')).rejects.toThrow(
      NotFoundException,
    );
    expect(i18nService.t).toHaveBeenCalledWith('users.errors.notFound', {
      lang: undefined,
    });
  });

  it('should throw translated bad request error when following yourself', async () => {
    usersRepository.findOne.mockResolvedValueOnce(user).mockResolvedValue(user);

    await expect(service.follow(user.id, user.username)).rejects.toThrow(
      BadRequestException,
    );
    expect(i18nService.t).toHaveBeenCalledWith(
      'profiles.errors.cannotFollowYourself',
      {
        lang: undefined,
      },
    );
  });

  it('should return profile without password and include following status', async () => {
    usersRepository.findOne.mockResolvedValue({
      ...user,
      followers: [{ id: 2 }],
    });

    const result = await service.findByUsername(user.username, 2);

    expect(result).not.toHaveProperty('password');
    expect(result).toMatchObject({
      email: user.email,
      following: true,
      id: user.id,
      username: user.username,
    });
  });
});
