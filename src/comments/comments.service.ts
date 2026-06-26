import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { unlink } from 'fs/promises';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { DataSource, Repository } from 'typeorm';

import { Article } from '../articles/entities/article.entity';
import { AttachmentsService } from '../attachments/attachments.service';
import { User } from '../users/entities/user.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,

    @InjectRepository(Article)
    private readonly articlesRepository: Repository<Article>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    private readonly attachmentsService: AttachmentsService,

    private readonly dataSource: DataSource,

    private readonly i18n: I18nService,
  ) {}

  async create(
    articleId: number,
    userId: number,
    createCommentDto: CreateCommentDto,
    files: Express.Multer.File[],
  ) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const article = await manager.getRepository(Article).findOne({
          where: { id: articleId },
        });

        if (!article) {
          throw new NotFoundException(
            this.translate('articles.errors.notFound'),
          );
        }

        const author = await manager.getRepository(User).findOne({
          where: { id: userId },
        });

        if (!author) {
          throw new NotFoundException(this.translate('users.errors.notFound'));
        }

        const commentsRepository = manager.getRepository(Comment);
        const comment = commentsRepository.create({
          body: createCommentDto.body,
          article,
          author,
        });

        const savedComment = await commentsRepository.save(comment);

        const attachments = await this.attachmentsService.createMany(
          files,
          'comment',
          savedComment.id.toString(),
          manager,
        );

        return {
          ...this.createCommentResponse(savedComment),
          attachments: attachments.map((attachment) =>
            this.createAttachmentResponse(attachment),
          ),
        };
      });
    } catch (error) {
      await this.deleteUploadedFiles(files);
      this.logger.error(
        'Failed to create comment',
        error instanceof Error ? error.stack : undefined,
        JSON.stringify({ articleId, userId }),
      );
      throw error;
    }
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

    const commentsWithAttachments = await Promise.all(
      comments.map(async (comment) => {
        const attachments = await this.attachmentsService.findByObject(
          'comment',
          comment.id.toString(),
        );

        return {
          ...this.createCommentResponse(comment),
          attachments: attachments.map((attachment) =>
            this.createAttachmentResponse(attachment),
          ),
        };
      }),
    );

    return commentsWithAttachments;
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

    try {
      await this.attachmentsService.softDeleteByObject(
        'comment',
        comment.id.toString(),
      );

      await this.commentsRepository.remove(comment);

      return {
        message: this.translate('comments.messages.deleted'),
      };
    } catch (error) {
      throw error;
    }
  }

  private createCommentResponse(comment: Comment) {
    const { password, ...author } = comment.author;

    return {
      ...comment,
      author,
    };
  }

  private createAttachmentResponse(attachment: {
    id: string;
    filename: string;
  }) {
    return {
      id: attachment.id,
      filename: attachment.id,
      url: `/attachments/${attachment.id}`,
    };
  }

  private async deleteUploadedFiles(files: Express.Multer.File[]) {
    await Promise.all(
      (files ?? []).map((file) =>
        unlink(file.path).catch((error: unknown) => {
          this.logger.warn(
            `Failed to delete uploaded file ${file.path}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }),
      ),
    );
  }

  private translate(key: string): string {
    return this.i18n.t(key, { lang: I18nContext.current()?.lang });
  }
}
