import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection } from 'typeorm';
import * as request from 'supertest';

import { AppModule } from '../../src/app.module';
import loadFixture from '../fixtures/loadFixtures';
import getToken from '../fixtures/token.mock';
import {
  newCategory,
  newCategoryChange,
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
    expect(fail.body.message).toEqual(
      'Category with name New Category already exists',
    );
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
    const result = await request(app.getHttpServer())
      .get('/category')
      .set('Authorization', `Bearer ${token}`);
    expect(result.status).toEqual(200);
    expect(result.body.length).toBeGreaterThan(1);
    expect(result.body[0]).toMatchObject({
      id: expect.any(Number),
      name: expect.any(String),
      skillCount: expect.any(Number),
    });
  });
  it('Should be able to get categories as user', async () => {
    const result = await request(app.getHttpServer())
      .get('/category')
      .set('Authorization', `Bearer ${userToken}`);
    expect(result.status).toEqual(200);
    expect(result.body.length).toBeGreaterThan(1);
    expect(result.body[0]).toMatchObject({
      id: expect.any(Number),
      name: expect.any(String),
      skillCount: expect.any(Number),
    });
  });
  it('Should be able to get single category by id as user', async () => {
    const result = await request(app.getHttpServer())
      .get('/category/1111')
      .set('Authorization', `Bearer ${userToken}`);
    expect(result.status).toEqual(200);
    expect(result.body).toMatchObject({
      id: expect.any(Number),
      name: expect.any(String),
      skills: expect.any(Array),
    });
  });
  it('Should be able to get single category by id as admin', async () => {
    const result = await request(app.getHttpServer())
      .get('/category/1111')
      .set('Authorization', `Bearer ${token}`);
    expect(result.status).toEqual(200);
    expect(result.body).toMatchObject({
      id: expect.any(Number),
      name: expect.any(String),
      skills: expect.any(Array),
    });
  });
  it('Should return error if category id does not exist', async () => {
    const result = await request(app.getHttpServer())
      .get('/category/899')
      .set('Authorization', `Bearer ${token}`);
    expect(result.status).toEqual(404);
    expect(result.body.message).toEqual('Category of id: 899 does not exist');
  });
  it('Should be able to update category', async () => {
    const result = await request(app.getHttpServer())
      .patch('/category/1111')
      .set('Authorization', `Bearer ${token}`)
      .send(newCategoryChange);
    expect(result.status).toEqual(200);
    expect(result.body).toEqual({});
  });
  it('Should not be able to update category with invalid data (minlength)', async () => {
    const result = await request(app.getHttpServer())
      .patch('/category/1111')
      .set('Authorization', `Bearer ${token}`)
      .send(newCategoryShort);
    expect(result.status).toEqual(400);
    expect(result.body.message).toEqual([
      'Name needs at least 3 characters, up to 400 characters!',
    ]);
  });
  it('Should not be able to update category with invalid data (maxlength)', async () => {
    const result = await request(app.getHttpServer())
      .patch('/category/1111')
      .set('Authorization', `Bearer ${token}`)
      .send(newCategoryLong);
    expect(result.status).toEqual(400);
    expect(result.body.message).toEqual([
      'Name needs at least 3 characters, up to 400 characters!',
    ]);
  });
  it('Should not be able to update category as user', async () => {
    const result = await request(app.getHttpServer())
      .patch('/category/1111')
      .set('Authorization', `Bearer ${userToken}`)
      .send(newCategoryChange);
    expect(result.status).toEqual(401);
    expect(result.body.message).toEqual('Unauthorized!!!');
  });
  it('Should be able to delete category', async () => {
    const result = await request(app.getHttpServer())
      .delete('/category/11151')
      .set('Authorization', `Bearer ${token}`);
    expect(result.status).toEqual(204);
  });
  it('Should not be able to delete category with skills', async () => {
    const result = await request(app.getHttpServer())
      .delete('/category/1112')
      .set('Authorization', `Bearer ${token}`);
    expect(result.status).toEqual(400);
    expect(result.body.message).toEqual([
      'Category with id 1112 is associated with skills and cannot be deleted',
    ]);
  });
  it('Should return error if category to be deleted does not exist', async () => {
    const result = await request(app.getHttpServer())
      .delete('/category/13123123')
      .set('Authorization', `Bearer ${token}`);
    expect(result.status).toEqual(404);
    expect(result.body.message).toEqual('Category with id 13123123 not found!');
  });
  it('Should not be able to delete category as user', async () => {
    const result = await request(app.getHttpServer())
      .delete('/category/1112')
      .set('Authorization', `Bearer ${userToken}`);
    expect(result.status).toEqual(401);
    expect(result.body.message).toEqual('Unauthorized!!!');
  });
});
