import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection } from 'typeorm';
import * as request from 'supertest';

import { AppModule } from '../../src/app.module';
import loadFixture from '../fixtures/loadFixtures';
import getToken from '../fixtures/token.mock';

import { Role } from './../../src/user/authorization/role.enum';

let app: INestApplication;
let mod: TestingModule;
let connection: Connection;

describe('E2E actions tests', () => {
  let token;
  let userToken;
  let limitToken;
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
    await loadFixture(connection, '_offer_.sql');
    await loadFixture(connection, '_offer_applicants_user_.sql');
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
    limitToken = getToken(
      {
        id: 11144,
        username: 'bdalgetty17',
        roles: [Role.User],
      },
      app,
    );
  });

  afterAll(async () => {
    await app.close();
  });
  it('Should be able to apply for an offer', async () => {
    const result = await request(app.getHttpServer())
      .patch('/actions/apply')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ offerId: 11110 });
    expect(result.status).toEqual(200);
    expect(result.body).toMatchObject({
      id: 11110,
      title: 'Seamless',
      description:
        'Aenean fermentum. Donec ut mauris eget massa tempor convallis. Nulla neque libero, convallis eget, eleifend luctus, ultricies eu, nibh.',
      available: true,
      limit: 8,
      ownerId: 11110,
      skillId: 11110,
      status: 1,
      participants: [],
      applicants: [
        {
          id: 111100,
          username: 'kduberry2r',
          name: 'Kyle',
          surname: 'Duberry',
          email: 'kduberry2r@opensource.org',
          about:
            'Sed sagittis. Nam congue, risus semper porta volutpat, quam pede lobortis ligula, sit amet eleifend pede libero quis orci. Nullam molestie nibh in lectus.',
          roles: 'user',
          applied: [],
          participates: [],
        },
      ],
    });
  });
  it('Should not be able to apply for own offer', async () => {
    const result = await request(app.getHttpServer())
      .patch('/actions/apply')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ offerId: 111101 });
    expect(result.status).toEqual(400);
    expect(result.body.message).toEqual("Can't apply for your own offer");
  });
  it('Should not be able to apply for nonexisting offer', async () => {
    const result = await request(app.getHttpServer())
      .patch('/actions/apply')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ offerId: 997 });
    expect(result.status).toEqual(404);
    expect(result.body.message).toEqual('Offer with id 997 not found!');
  });
  it('Should not be able to apply if offer limit reached', async () => {
    await request(app.getHttpServer())
      .patch('/actions/apply')
      .set('Authorization', `Bearer ${token}`)
      .send({ offerId: 11119 });
    const result = await request(app.getHttpServer())
      .patch('/actions/apply')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ offerId: 11119 });
    expect(result.status).toEqual(404);
    expect(result.body.message).toEqual(
      'Offer with id 11119 has already reached skill share limit of 1!',
    );
  });
  it('Should not be able to apply if already applied/ participates in more than 10 offers', async () => {
    const result = await request(app.getHttpServer())
      .patch('/actions/apply')
      .set('Authorization', `Bearer ${limitToken}`)
      .send({ offerId: 11130 });
    expect(result.status).toEqual(404);
    expect(result.body.message).toEqual(
      'User with id 11144 has already reached skill share limit of 10!',
    );
  });
});
