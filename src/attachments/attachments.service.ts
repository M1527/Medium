import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { parse } from 'path';
import { EntityManager, Repository } from 'typeorm';

import { Attachment } from './entities/attachment.entity';

type AttachmentUploadFile = Express.Multer.File & {
  attachmentId?: string;
};

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
    manager?: EntityManager,
  ) {
    if (!files || files.length === 0) {
      return [];
    }

    const repository =
      manager?.getRepository(Attachment) ?? this.attachmentsRepository;

    const attachments = files.map((file) => {
      const attachmentId =
        (file as AttachmentUploadFile).attachmentId ??
        parse(file.filename).name;

      return repository.create({
        id: attachmentId,
        filename: attachmentId,
        path: file.path,
        contentType: file.mimetype,
        size: file.size,
        objectType,
        objectId,
      });
    });

    return repository.save(attachments);
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

  async softDeleteByObject(objectType: string, objectId: string) {
    return this.attachmentsRepository.softDelete({
      objectType,
      objectId,
    });
  }
}
