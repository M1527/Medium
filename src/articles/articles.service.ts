import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';

import { UserResponseDto } from '../users/dto/user-response.dto';
import { User } from '../users/entities/user.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { QueryArticlesDto } from './dto/query-articles.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article } from './entities/article.entity';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articlesRepository: Repository<Article>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    private readonly i18n: I18nService,
  ) {}

  async create(createArticleDto: CreateArticleDto, userId: number) {
    const author = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!author) {
      throw new NotFoundException(this.translate('users.errors.notFound'));
    }

    const article = this.articlesRepository.create(createArticleDto);
    article.author = author;

    try {
      const savedArticle = await this.articlesRepository.save(article);

      return this.createArticleResponse(savedArticle);
    } catch (error) {
      throw error;
    }
  }

  async findAll(query: QueryArticlesDto) {
    const qb = this.articlesRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author');

    if (query.q?.trim()) {
      qb.andWhere(
        `(
          article.title LIKE :q OR
          article.description LIKE :q OR
          article.body LIKE :q
        )`,
        {
          q: `%${query.q.trim()}%`,
        },
      );
    }

    if (query.author?.trim()) {
      qb.andWhere('author.username LIKE :author', {
        author: `%${query.author.trim()}%`,
      });
    }

    const page = query.page ?? 1;
    const items = query.items ?? 20;
    const skip = (page - 1) * items;

    qb.orderBy('article.createdAt', 'DESC').skip(skip).take(items);

    const [articles, articlesCount] = await qb.getManyAndCount();

    return {
      articles: articles.map((article) => this.createArticleResponse(article)),
      articlesCount,
    };
  }

  async findOne(id: number) {
    const article = await this.getArticleOrThrow(id);

    return this.createArticleResponse(article);
  }

  async update(
    id: number,
    userId: number,
    updateArticleDto: UpdateArticleDto,
  ) {
    const article = await this.getArticleOrThrow(id);
    this.assertAuthor(article, userId);

    Object.assign(article, updateArticleDto);

    try {
      const updatedArticle = await this.articlesRepository.save(article);

      return this.createArticleResponse(updatedArticle);
    } catch (error) {
      throw error;
    }
  }

  async remove(id: number, userId: number) {
    const article = await this.getArticleOrThrow(id);
    this.assertAuthor(article, userId);

    try {
      await this.articlesRepository.remove(article);

      return {
        message: this.translate('articles.messages.deleted'),
      };
    } catch (error) {
      throw error;
    }
  }

  private async getArticleOrThrow(id: number) {
    const article = await this.articlesRepository.findOne({
      where: { id },
      relations: {
        author: true,
      },
    });

    if (!article) {
      throw new NotFoundException(this.translate('articles.errors.notFound'));
    }

    return article;
  }

  private assertAuthor(article: Article, userId: number) {
    if (article.author.id !== userId) {
      throw new ForbiddenException(this.translate('articles.errors.forbidden'));
    }
  }

  private createArticleResponse(article: Article) {
    return {
      ...article,
      author: UserResponseDto.createFromUser(article.author),
    };
  }

  private translate(key: string): string {
    return this.i18n.t(key, { lang: I18nContext.current()?.lang });
  }
}