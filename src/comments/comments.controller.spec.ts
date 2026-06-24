import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { DataSource, Repository } from 'typeorm';

import { AppModule } from '../app.module';
import { Article } from '../articles/entities/article.entity';
import { Comment } from './entities/comment.entity';
import { User } from '../users/entities/user.entity';
import {
  seedArticle,
  seedComment,
  seedUser,
  truncateTables,
} from '../test/seed-record';

describe('CommentsController (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let articleRepository: Repository<Article>;
  let commentRepository: Repository<Comment>;
  let userRepository: Repository<User>;

  jest.setTimeout(60000);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();

    dataSource = app.get(DataSource);
    articleRepository = dataSource.getRepository(Article);
    commentRepository = dataSource.getRepository(Comment);
    userRepository = dataSource.getRepository(User);
  });

  beforeEach(async () => {
    await truncateTables(dataSource, ['comments', 'articles', 'users']);
  });

  afterAll(async () => {
    await app.close();
  });

  async function login(email: string, password: string) {
    const response = await request(app.getHttpServer())
      .post('/users/login')
      .send({ email, password })
      .expect(201);

    return response.body.access_token as string;
  }

  it('POST /articles/:articleId/comments creates comment', async () => {
    const author = await seedUser(userRepository, {
      email: 'author1@example.com',
      username: 'author1',
      password: 'password123',
    });

    const token = await login(author.email, 'password123');

    const article = await seedArticle(articleRepository, author.id, {
      title: 'Article for comments',
      description: 'Desc',
      body: 'Body',
    });

    const response = await request(app.getHttpServer())
      .post(`/articles/${article.id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        body: 'Nice article!',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      body: 'Nice article!',
      author: {
        id: author.id,
        email: author.email,
        username: author.username,
      },
    });

    const savedComment = await commentRepository.findOne({
      where: { id: response.body.id },
      relations: {
        author: true,
        article: true,
      },
    });

    expect(savedComment).toBeDefined();
    expect(savedComment?.article.id).toBe(article.id);
  });

  it('GET /articles/:articleId/comments returns comments list', async () => {
    const author = await seedUser(userRepository, {
      email: 'author1@example.com',
      username: 'author1',
      password: 'password123',
    });

    const article = await seedArticle(articleRepository, author.id, {
      title: 'Article for comments',
      description: 'Desc',
      body: 'Body',
    });

    await seedComment(commentRepository, author.id, article.id, {
      body: 'First comment',
    });

    await seedComment(commentRepository, author.id, article.id, {
      body: 'Second comment',
    });

    const response = await request(app.getHttpServer())
      .get(`/articles/${article.id}/comments`)
      .expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body[0].body).toBe('First comment');
    expect(response.body[1].body).toBe('Second comment');
  });

  it('DELETE /comments/:id lets author delete own comment', async () => {
    const author = await seedUser(userRepository, {
      email: 'author1@example.com',
      username: 'author1',
      password: 'password123',
    });

    const token = await login(author.email, 'password123');

    const article = await seedArticle(articleRepository, author.id, {
      title: 'Article for comments',
      description: 'Desc',
      body: 'Body',
    });

    const comment = await seedComment(commentRepository, author.id, article.id, {
      body: 'Delete me',
    });

    const response = await request(app.getHttpServer())
      .delete(`/comments/${comment.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      message: 'Comment deleted successfully',
    });

    const deletedComment = await commentRepository.findOne({
      where: { id: comment.id },
    });

    expect(deletedComment).toBeNull();
  });

  it('DELETE /comments/:id forbids non-author delete', async () => {
    const author = await seedUser(userRepository, {
      email: 'author1@example.com',
      username: 'author1',
      password: 'password123',
    });

    const otherUser = await seedUser(userRepository, {
      email: 'author2@example.com',
      username: 'author2',
      password: 'password123',
    });

    const authorToken = await login(author.email, 'password123');
    const otherToken = await login(otherUser.email, 'password123');

    const article = await seedArticle(articleRepository, author.id, {
      title: 'Article for comments',
      description: 'Desc',
      body: 'Body',
    });

    const comment = await seedComment(commentRepository, author.id, article.id, {
      body: 'Do not delete',
    });

    await request(app.getHttpServer())
      .delete(`/comments/${comment.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);

    const existingComment = await commentRepository.findOne({
      where: { id: comment.id },
    });

    expect(existingComment).toBeDefined();
  });
});