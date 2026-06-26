import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('attachments')
export class Attachment {
  @PrimaryColumn('uuid')
  id!: string;

  @Column()
  filename!: string;

  @Column()
  path!: string;

  @Column()
  contentType!: string;

  @Column()
  size!: number;

  @Column()
  objectType!: string;

  @Column()
  objectId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
