import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';

import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

type AttachmentUploadFile = Express.Multer.File & {
  attachmentId?: string;
};

@ApiTags('comments')
@ApiBearerAuth()
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('articles/:articleId/comments')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads/comments',
        filename: (req, file, cb) => {
          const attachmentId = randomUUID();

          (file as AttachmentUploadFile).attachmentId = attachmentId;
          cb(null, `${attachmentId}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['body'],
      properties: {
        body: {
          type: 'string',
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  create(
    @Param('articleId', ParseIntPipe) articleId: number,
    @Body() createCommentDto: CreateCommentDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    return this.commentsService.create(
      articleId,
      req.user.userId,
      createCommentDto,
      files,
    );
  }

  @Get('articles/:articleId/comments')
  findAll(@Param('articleId', ParseIntPipe) articleId: number) {
    return this.commentsService.findAll(articleId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('comments/:id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.commentsService.remove(id, req.user.userId);
  }
}
