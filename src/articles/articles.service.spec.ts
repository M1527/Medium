import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { User } from '../users/entities/user.entity';
import { ArticlesService } from './articles.service';
import { Article } from './entities/article.entity';

describe('ArticlesService', () => {
  let service: ArticlesService;
  let articlesRepository: {
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
    save: jest.Mock;
  };
  let usersRepository: {
    findOne: jest.Mock;
  };
  let i18nService: {
    t: jest.Mock;
  };

  const author = {
    id: 1,
    email: 'author@example.com',
    username: 'author',
    password: 'hashed-password',
    createdAt: new Date('2026-06-18T00:00:00.000Z'),
    updatedAt: new Date('2026-06-18T00:00:00.000Z'),
  } as User;

  beforeEach(async () => {
    articlesRepository = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      save: jest.fn(),
    };
    usersRepository = {
      findOne: jest.fn(),
    };
    i18nService = {
      t: jest.fn((key: string) => key),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        {
          provide: getRepositoryToken(Article),
          useValue: articlesRepository,
        },
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

    service = module.get<ArticlesService>(ArticlesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return created article without author password', async () => {
    const createArticleDto = {
      body: 'Body',
      description: 'Description',
      title: 'Title',
    };
    const article = {
      id: 1,
      ...createArticleDto,
      author,
    };

    usersRepository.findOne.mockResolvedValue(author);
    articlesRepository.create.mockReturnValue(article);
    articlesRepository.save.mockResolvedValue(article);

    const result = await service.create(createArticleDto, author.id);

    expect(result.author).not.toHaveProperty('password');
    expect(result.author).toMatchObject({
      email: author.email,
      id: author.id,
      username: author.username,
    });
  });

  it('should throw translated not found error when article does not exist', async () => {
    articlesRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    expect(i18nService.t).toHaveBeenCalledWith('articles.errors.notFound', {
      lang: undefined,
    });
  });

  it('should throw translated forbidden error when user is not author', async () => {
    articlesRepository.findOne.mockResolvedValue({
      id: 1,
      author,
    });

    await expect(service.remove(1, 2)).rejects.toThrow(ForbiddenException);
    expect(i18nService.t).toHaveBeenCalledWith('articles.errors.forbidden', {
      lang: undefined,
    });
  });

  it('should return translated success message after removing article', async () => {
    articlesRepository.findOne.mockResolvedValue({
      id: 1,
      author,
    });
    articlesRepository.remove.mockResolvedValue(undefined);

    await expect(service.remove(1, author.id)).resolves.toEqual({
      message: 'articles.messages.deleted',
    });
    expect(i18nService.t).toHaveBeenCalledWith('articles.messages.deleted', {
      lang: undefined,
    });
  });
});
