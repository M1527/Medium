export class AttachmentResponseDto {
  id!: string;
  filename!: string;
  url!: string;

  static create(attachment: {
    id: string;
    filename: string;
  }) {
    return {
      id: attachment.id,
      filename: attachment.filename,
      url: `/attachments/${attachment.id}`,
    };
  }
}