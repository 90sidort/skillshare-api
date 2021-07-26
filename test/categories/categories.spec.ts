import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection } from 'typeorm';
import * as request from 'supertest';

import { AppModule } from '../../src/app.module';
import loadFixture from '../fixtures/loadFixtures';
import getToken from '../fixtures/token.mock';
import {
  newCategory,
  newCategoryLong,
  newCategoryShort,
} from './category.mocks';
import { Role } from './../../src/user/authorization/role.enum';

let app: INestApplication;
let mod: TestingModule;
let connection: Connection;

describe('E2E categories tests', () => {
  let token;
  let userToken;
  beforeAll(async () => {
    mod = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = mod.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    connection = app.get(Connection);
    await loadFixture(connection, '_category_.sql');
    await loadFixture(connection, '_skills_.sql');
    await loadFixture(connection, '_user_.sql');
    token = getToken(
      {
        id: 111101,
        username: 'admin',
        roles: [Role.Admin],
      },
      app,
    );
    userToken = getToken(
      {
        id: 111100,
        username: 'kduberry2r',
        roles: [Role.User],
      },
      app,
    );
  });

  afterAll(async () => {
    await app.close();
  });
  it('Should be able to create category', async () => {
    const result = await request(app.getHttpServer())
      .post('/category')
      .set('Authorization', `Bearer ${token}`)
      .send(newCategory);
    expect(result.status).toEqual(201);
  });
  it('Should not be able to create category with name that already exists', async () => {
    await request(app.getHttpServer())
      .post('/category')
      .set('Authorization', `Bearer ${token}`)
      .send(newCategory);
    const fail = await request(app.getHttpServer())
      .post('/category')
      .set('Authorization', `Bearer ${token}`)
      .send(newCategory);
    expect(fail.status).toEqual(400);
    expect(fail.body.message).toEqual([
      'Category with name New Category already exists',
    ]);
  });
  it('Should not be able to create category without mandatory data', async () => {
    const result = await request(app.getHttpServer())
      .post('/category')
      .send({})
      .set('Authorization', `Bearer ${token}`);
    expect(result.status).toEqual(400);
    expect(result.body.message).toEqual([
      'Name needs at least 3 characters, up to 400 characters!',
      'Name should be a string!',
    ]);
  });
  it('Should not be able to create category with invalid data (minlength)', async () => {
    const result = await request(app.getHttpServer())
      .post('/category')
      .send(newCategoryShort)
      .set('Authorization', `Bearer ${token}`);
    expect(result.status).toEqual(400);
    expect(result.body.message).toEqual([
      'Name needs at least 3 characters, up to 400 characters!',
    ]);
  });
  it('Should not be able to create category with invalid data (minlength)', async () => {
    const result = await request(app.getHttpServer())
      .post('/category')
      .send(newCategoryLong)
      .set('Authorization', `Bearer ${token}`);
    expect(result.status).toEqual(400);
    expect(result.body.message).toEqual([
      'Name needs at least 3 characters, up to 400 characters!',
    ]);
  });
  it('Should not be able to create category as regular user', async () => {
    const result = await request(app.getHttpServer())
      .post('/category')
      .send(newCategoryLong)
      .set('Authorization', `Bearer ${userToken}`);
    expect(result.status).toEqual(401);
    expect(result.body.message).toEqual('Unauthorized!!!');
  });
  it('Should be able to get categories as admin', async () => {
    const test = await request(app.getHttpServer())
      .get('/category')
      .set('Authorization', `Bearer ${token}`);
    expect(test.status).toEqual(200);
    expect(test.body.length).toBeGreaterThan(1);
    expect(test.body[0]).toMatchObject({
      id: expect.any(Number),
      name: expect.any(String),
      skillCount: expect.any(Number),
    });
  });
  it('Should be able to get categories as user', async () => {
    const test = await request(app.getHttpServer())
      .get('/category')
      .set('Authorization', `Bearer ${userToken}`);
    expect(test.status).toEqual(200);
    expect(test.body.length).toBeGreaterThan(1);
    expect(test.body[0]).toMatchObject({
      id: expect.any(Number),
      name: expect.any(String),
      skillCount: expect.any(Number),
    });
  });
});
