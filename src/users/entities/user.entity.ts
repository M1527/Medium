import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Article } from '../../articles/entities/article.entity';
import { Comment } from '../../comments/entities/comment.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  username!: string;

  @Column()
  password!: string;

  @OneToMany(() => Article, (article) => article.author)
  articles!: Article[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments!: Comment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
