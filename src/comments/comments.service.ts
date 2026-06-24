import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';

import { Article } from '../articles/entities/article.entity';
import { User } from '../users/entities/user.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,

    @InjectRepository(Article)
    private readonly articlesRepository: Repository<Article>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    private readonly i18n: I18nService,
  ) {}

  async create(
    articleId: number,
    userId: number,
    createCommentDto: CreateCommentDto,
  ) {
    const article = await this.articlesRepository.findOne({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException(this.translate('articles.errors.notFound'));
    }

    const author = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!author) {
      throw new NotFoundException(this.translate('users.errors.notFound'));
    }

    const comment = this.commentsRepository.create({
      body: createCommentDto.body,
      article,
      author,
    });

    const savedComment = await this.commentsRepository.save(comment);

    return this.createCommentResponse(savedComment);
  }

  async findAll(articleId: number) {
    const comments = await this.commentsRepository.find({
      where: {
        article: {
          id: articleId,
        },
      },
      relations: {
        author: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });

    return comments.map((comment) => this.createCommentResponse(comment));
  }

  async remove(id: number, userId: number) {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: {
        author: true,
      },
    });

    if (!comment) {
      throw new NotFoundException(this.translate('comments.errors.notFound'));
    }

    if (comment.author.id !== userId) {
      throw new ForbiddenException(this.translate('comments.errors.forbidden'));
    }

    await this.commentsRepository.remove(comment);

    return {
      message: this.translate('comments.messages.deleted'),
    };
  }

  private createCommentResponse(comment: Comment) {
    const { password, ...author } = comment.author;

    return {
      ...comment,
      author,
    };
  }

  private translate(key: string): string {
    return this.i18n.t(key, { lang: I18nContext.current()?.lang });
  }
}
