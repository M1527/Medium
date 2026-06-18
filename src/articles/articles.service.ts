import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Article } from './entities/article.entity';
import { User } from '../users/entities/user.entity';

import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articlesRepository: Repository<Article>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}
  async create(createArticleDto: CreateArticleDto, userId: number) {
    const author = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!author) {
      throw new NotFoundException('User not found');
    }

    const article = this.articlesRepository.create({
      ...createArticleDto,
      author,
    });

    return await this.articlesRepository.save(article);
  }
  private async getArticleOrThrow(id: number) {
  const article = await this.articlesRepository.findOne({
    where: { id },
    relations: {
      author: true,
    },
  });

  if (!article) {
    throw new NotFoundException('Article not found');
  }

  return article;
}

private assertAuthor(article: Article, userId: number) {
  if (article.author.id !== userId) {
    throw new ForbiddenException('You are not allowed to modify this article');
  }
}

async findAll() {
  const articles = await this.articlesRepository.find({
    relations: {
      author: true,
    },
    });

    return articles.map((article) => {
      const { password, ...author } = article.author;

      return {
        ...article,
        author,
      };
    });
  }

  async findOne(id: number) {
    const article = await this.articlesRepository.findOne({
      where: { id },
      relations: {
        author: true,
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const { password, ...author } = article.author;

    return {
      ...article,
      author,
    };
  }

  async update(id: number, userId: number, updateArticleDto: UpdateArticleDto) {
  const article = await this.getArticleOrThrow(id);
  this.assertAuthor(article, userId);

  Object.assign(article, updateArticleDto);

  const updatedArticle = await this.articlesRepository.save(article);

  const { password, ...author } = updatedArticle.author;

  return {
    ...updatedArticle,
    author,
  };
}

  async remove(id: number, userId: number) {
  const article = await this.getArticleOrThrow(id);
  this.assertAuthor(article, userId);

  await this.articlesRepository.remove(article);

  return {
    message: 'Article deleted successfully',
  };
}
}
