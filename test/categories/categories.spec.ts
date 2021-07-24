import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection } from 'typeorm';
import * as request from 'supertest';

import { AppModule } from '../../src/app.module';
import loadFixture from './../mocks/loadFixtures';
import getToken from './../mocks/token.mock';

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
    token = getToken({}, app);
  });

  afterAll(async () => {
    await app.close();
  });
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
