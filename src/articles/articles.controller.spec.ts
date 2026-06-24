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
import { Article } from './entities/article.entity';
import { User } from '../users/entities/user.entity';
import { seedArticle, seedUser, truncateTables } from '../test/seed-record';

describe('ArticlesController (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let articleRepository: Repository<Article>;
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
    userRepository = dataSource.getRepository(User);
  });

  beforeEach(async () => {
    await truncateTables(dataSource, ['articles', 'users']);
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

  async function createArticle(
    token: string,
    payload: {
      title: string;
      description: string;
      body: string;
    },
  ) {
    const response = await request(app.getHttpServer())
      .post('/articles')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    return response.body;
  }

  it('POST /articles creates article and persists authorId', async () => {
    const author = await seedUser(userRepository, {
      email: 'author1@example.com',
      username: 'author1',
      password: 'password123',
    });

    const token = await login(author.email, 'password123');

    const response = await createArticle(token, {
      title: 'My First Article',
      description: 'This is my first article',
      body: 'Hello Medium Clone',
    });

    expect(response).toMatchObject({
      title: 'My First Article',
      description: 'This is my first article',
      body: 'Hello Medium Clone',
      author: {
        id: author.id,
        email: author.email,
        username: author.username,
      },
    });

    const savedArticle = await articleRepository.findOne({
      where: { id: response.id },
      relations: {
        author: true,
      },
    });

    expect(savedArticle).toBeDefined();
    expect(savedArticle?.author.id).toBe(author.id);
  });

  it('GET /articles returns paginated articles and supports search/filter', async () => {
    const author1 = await seedUser(userRepository, {
      email: 'author1@example.com',
      username: 'author1',
      password: 'password123',
    });

    const author2 = await seedUser(userRepository, {
      email: 'author2@example.com',
      username: 'author2',
      password: 'password123',
    });

    const token1 = await login(author1.email, 'password123');
    const token2 = await login(author2.email, 'password123');

    await createArticle(token1, {
      title: 'NestJS Tutorial One',
      description: 'Learn NestJS basics',
      body: 'NestJS content one',
    });

    await createArticle(token1, {
      title: 'TypeORM Guide',
      description: 'Learn TypeORM',
      body: 'TypeORM content',
    });

    await createArticle(token2, {
      title: 'NestJS Tutorial Two',
      description: 'More NestJS',
      body: 'NestJS content two',
    });

    const page1 = await request(app.getHttpServer())
      .get('/articles?page=1&items=2')
      .expect(200);

    expect(page1.body.articles).toHaveLength(2);
    expect(page1.body.articlesCount).toBe(3);

    const page2 = await request(app.getHttpServer())
      .get('/articles?page=2&items=2')
      .expect(200);

    expect(page2.body.articles).toHaveLength(1);
    expect(page2.body.articlesCount).toBe(3);

    const search = await request(app.getHttpServer())
      .get('/articles?page=1&items=10&q=NestJS')
      .expect(200);

    expect(search.body.articles).toHaveLength(2);
    expect(search.body.articlesCount).toBe(2);

    const filterByAuthor = await request(app.getHttpServer())
      .get('/articles?page=1&items=10&author=author2')
      .expect(200);

    expect(filterByAuthor.body.articles).toHaveLength(1);
    expect(filterByAuthor.body.articlesCount).toBe(1);
    expect(filterByAuthor.body.articles[0].author.username).toBe('author2');
  });

  it('GET /articles/:id returns article by id', async () => {
    const author = await seedUser(userRepository, {
      email: 'author1@example.com',
      username: 'author1',
      password: 'password123',
    });

    const token = await login(author.email, 'password123');

    const createdArticle = await createArticle(token, {
      title: 'Get By Id Article',
      description: 'Description',
      body: 'Body content',
    });

    const response = await request(app.getHttpServer())
      .get(`/articles/${createdArticle.id}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: createdArticle.id,
      title: 'Get By Id Article',
      description: 'Description',
      body: 'Body content',
      author: {
        id: author.id,
        email: author.email,
        username: author.username,
      },
    });
  });

  it('PUT /articles/:id lets author update own article', async () => {
    const author = await seedUser(userRepository, {
      email: 'author1@example.com',
      username: 'author1',
      password: 'password123',
    });

    const token = await login(author.email, 'password123');

    const createdArticle = await createArticle(token, {
      title: 'Old Title',
      description: 'Old Description',
      body: 'Old Body',
    });

    const response = await request(app.getHttpServer())
      .put(`/articles/${createdArticle.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'New Title',
        description: 'New Description',
        body: 'New Body',
      })
      .expect(200);

    expect(response.body).toMatchObject({
      id: createdArticle.id,
      title: 'New Title',
      description: 'New Description',
      body: 'New Body',
    });

    const updatedArticle = await articleRepository.findOne({
      where: { id: createdArticle.id },
    });

    expect(updatedArticle?.title).toBe('New Title');
    expect(updatedArticle?.description).toBe('New Description');
    expect(updatedArticle?.body).toBe('New Body');
  });

  it('PUT /articles/:id forbids non-author update', async () => {
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

    const createdArticle = await createArticle(authorToken, {
      title: 'Original Title',
      description: 'Original Description',
      body: 'Original Body',
    });

    await request(app.getHttpServer())
      .put(`/articles/${createdArticle.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        title: 'Hacked Title',
        description: 'Hacked Description',
        body: 'Hacked Body',
      })
      .expect(403);

    const unchangedArticle = await articleRepository.findOne({
      where: { id: createdArticle.id },
    });

    expect(unchangedArticle?.title).toBe('Original Title');
    expect(unchangedArticle?.description).toBe('Original Description');
    expect(unchangedArticle?.body).toBe('Original Body');
  });

  it('DELETE /articles/:id lets author delete own article', async () => {
    const author = await seedUser(userRepository, {
      email: 'author1@example.com',
      username: 'author1',
      password: 'password123',
    });

    const token = await login(author.email, 'password123');

    const createdArticle = await createArticle(token, {
      title: 'Delete Me',
      description: 'Delete Description',
      body: 'Delete Body',
    });

    const response = await request(app.getHttpServer())
      .delete(`/articles/${createdArticle.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      message: 'Article deleted successfully',
    });

    const deletedArticle = await articleRepository.findOne({
      where: { id: createdArticle.id },
    });

    expect(deletedArticle).toBeNull();
  });

  it('DELETE /articles/:id forbids non-author delete', async () => {
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

    const createdArticle = await createArticle(authorToken, {
      title: 'Can Not Delete',
      description: 'Description',
      body: 'Body',
    });

    await request(app.getHttpServer())
      .delete(`/articles/${createdArticle.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);

    const existingArticle = await articleRepository.findOne({
      where: { id: createdArticle.id },
    });

    expect(existingArticle).toBeDefined();
  });
});