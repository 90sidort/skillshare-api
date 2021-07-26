import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection } from 'typeorm';
import * as request from 'supertest';

import { AppModule } from '../../src/app.module';
import loadFixture from '../fixtures/loadFixtures';
import getToken from '../fixtures/token.mock';
import { newCategory } from './category.mocks';
import { Role } from './../../src/user/authorization/role.enum';

let app: INestApplication;
let mod: TestingModule;
let connection: Connection;

describe('E2E categories tests', () => {
  let token;
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
        id: 101,
        username: 'admin',
        roles: [Role.Admin],
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
    console.log(result.body);
    expect(result.status).toEqual(201);
  });
  // it('Should not be able to create category without mandatory data', async () => {
  //   const test = await request(app.getHttpServer())
  //     .post('/category')
  //     .send({})
  //     .set('Authorization', `Bearer ${token}`);
  // });
  it('Test', async () => {
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
});
