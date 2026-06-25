import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Attachment } from './entities/attachment.entity';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentsRepository: Repository<Attachment>,
  ) {}

  async createMany(
    files: Express.Multer.File[],
    objectType: string,
    objectId: string,
  ) {
    if (!files || files.length === 0) {
      return [];
    }

    const attachments = files.map((file) =>
      this.attachmentsRepository.create({
        filename: file.originalname,
        path: file.path,
        contentType: file.mimetype,
        size: file.size,
        objectType,
        objectId,
      }),
    );

    return this.attachmentsRepository.save(attachments);
  }

  async findByObject(objectType: string, objectId: string) {
    return this.attachmentsRepository.find({
      where: {
        objectType,
        objectId,
      },
    });
  }

  async findById(id: string) {
    return this.attachmentsRepository.findOne({
      where: { id },
    });
  }
}