import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';

import { Article } from '../articles/entities/article.entity';
import { Comment } from '../comments/entities/comment.entity';
import { User } from '../users/entities/user.entity';

type SeedUserOptions = {
  email?: string;
  username?: string;
  password?: string;
};

type SeedArticleOptions = {
  title?: string;
  description?: string;
  body?: string;
};

type SeedCommentOptions = {
  body?: string;
};

export async function truncateTables(
  dataSource: DataSource,
  tables: string[],
) {
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');

  for (const table of tables) {
    await dataSource.query(`TRUNCATE TABLE \`${table}\``);
  }

  await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
}

export async function seedUser(
  userRepository: Repository<User>,
  options?: SeedUserOptions,
) {
  const email = options?.email ?? 'author@example.com';
  const username = options?.username ?? 'author';
  const password = options?.password ?? 'password123';

  const hashedPassword = await bcrypt.hash(password, 10);

  return userRepository.save({
    email,
    username,
    password: hashedPassword,
  });
}

export async function seedArticle(
  articleRepository: Repository<Article>,
  authorId: number,
  options?: SeedArticleOptions,
) {
  const title = options?.title ?? 'Default title';
  const description = options?.description ?? 'Default description';
  const body = options?.body ?? 'Default body';

  return articleRepository.save({
    title,
    description,
    body,
    author: { id: authorId } as User,
  });
}

export async function seedComment(
  commentRepository: Repository<Comment>,
  authorId: number,
  articleId: number,
  options?: SeedCommentOptions,
) {
  const body = options?.body ?? 'Default comment body';

  return commentRepository.save({
    body,
    author: { id: authorId } as User,
    article: { id: articleId } as Article,
  });
}