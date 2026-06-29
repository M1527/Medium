import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
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

  @ManyToMany(() => User, (user) => user.followers)
  @JoinTable({
    name: 'users_following_users',
    joinColumn: {
      name: 'followerId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'followingId',
      referencedColumnName: 'id',
    },
  })
  following!: User[];

  @ManyToMany(() => User, (user) => user.following)
  followers!: User[];
  @ManyToMany(() => Article, (article) => article.favoritedBy)
  @JoinTable({
    name: 'users_favorite_articles',
    joinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'articleId',
      referencedColumnName: 'id',
    },
  })
  favoriteArticles!: Article[];
}
