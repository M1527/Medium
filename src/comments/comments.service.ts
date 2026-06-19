import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
      throw new NotFoundException('Article not found');
    }

    const author = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!author) {
      throw new NotFoundException('User not found');
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
      throw new NotFoundException('Comment not found');
    }

    if (comment.author.id !== userId) {
      throw new ForbiddenException(
        'You are not allowed to delete this comment',
      );
    }

    await this.commentsRepository.remove(comment);

    return {
      message: 'Comment deleted successfully',
    };
  }

  private createCommentResponse(comment: Comment) {
    const { password, ...author } = comment.author;

    return {
      ...comment,
      author,
    };
  }
}
