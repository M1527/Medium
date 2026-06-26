import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

import { AttachmentsService } from './attachments.service';

@Controller('attachments')
export class AttachmentsController {
  constructor(
    private readonly attachmentsService: AttachmentsService,
  ) {}

  @Get(':id')
  async getFile(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const attachment = await this.attachmentsService.findById(id);

    if (!attachment) {
      throw new NotFoundException();
    }

    return res.sendFile(attachment.path, {
      root: process.cwd(),
    });
  }
}