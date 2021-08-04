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
    await loadFixture(connection, '_offer_participants_user_.sql');
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
          applied: expect.any(Array),
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
  it('Should not be able to apply for offer once again', async () => {
    const result = await request(app.getHttpServer())
      .patch('/actions/apply')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ offerId: 111106 });
    expect(result.status).toEqual(400);
    expect(result.body.message).toEqual(
      'You have already applied for offer of id 111106',
    );
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
  it('Should be able to resing from application', async () => {
    const result = await request(app.getHttpServer())
      .patch('/actions/deapply')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ offerId: 11123 });
    expect(result.status).toEqual(200);
    result.body.applicants.forEach((applicant) => {
      if (applicant.id === 111100) expect(false).toBe(true);
    });
  });
  it('Should be able to return error if resing offer from application dsnt exist', async () => {
    const result = await request(app.getHttpServer())
      .patch('/actions/deapply')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ offerId: 997 });
    expect(result.status).toEqual(404);
    expect(result.body.message).toEqual('Offer with id 997 not found!');
  });
  it('Should be able to get applicants to your offers', async () => {
    const result = await request(app.getHttpServer())
      .get(`/actions/applicants/${111100}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(result.status).toBe(200);
    expect(result.body[0]).toMatchObject({
      id: expect.any(Number),
      title: expect.any(String),
      description: expect.any(String),
      applicants: expect.any(Array),
      applicantCount: expect.any(Number),
      participantCount: expect.any(Number),
    });
  });
  it('Should not be able to get applicants to other user offers', async () => {
    const result = await request(app.getHttpServer())
      .get(`/actions/applicants/${11199}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(result.status).toBe(403);
    expect(result.body.message).toEqual(
      'User with id: 111100 is unauthorized!',
    );
  });
  it('Should be able to get applicants to offer of given user (admin)', async () => {
    const result = await request(app.getHttpServer())
      .get(`/actions/applicants/${111100}`)
      .set('Authorization', `Bearer ${token}`);
    expect(result.status).toBe(200);
    expect(result.body[0]).toMatchObject({
      id: expect.any(Number),
      title: expect.any(String),
      description: expect.any(String),
      applicants: expect.any(Array),
      applicantCount: expect.any(Number),
      participantCount: expect.any(Number),
    });
  });
  it('Should not be able to get applicants to offers of nonexisten user', async () => {
    const result = await request(app.getHttpServer())
      .get(`/actions/applicants/${997}`)
      .set('Authorization', `Bearer ${token}`);
    expect(result.status).toBe(404);
    expect(result.body.message).toEqual('User with id: 997 does not exist!');
  });
  it('Should be able to accept applicant', async () => {
    await request(app.getHttpServer())
      .patch('/actions/apply')
      .set('Authorization', `Bearer ${token}`)
      .send({ offerId: 111103 });
    const result = await request(app.getHttpServer())
      .patch('/actions/answer')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ offerId: 111103, userId: 111101, accepted: true });
    expect(result.status).toEqual(200);
    expect(result.body).toMatchObject({
      id: 111103,
      title: expect.any(String),
      description: expect.any(String),
      available: true,
      limit: 5,
      ownerId: 111100,
      skillId: 11150,
      status: 1,
      participants: [
        {
          id: 111101,
          username: 'admin',
          name: 'Admin',
          surname: 'Admin',
          email: 'test@test.com',
          about: 'Hi! Im your admin.',
          roles: 'admin',
          applied: expect.any(Array),
        },
      ],
      applicants: [],
    });
  });
  it('Should be able to reject applicant', async () => {
    await request(app.getHttpServer())
      .patch('/actions/apply')
      .set('Authorization', `Bearer ${token}`)
      .send({ offerId: 111104 });
    const result = await request(app.getHttpServer())
      .patch('/actions/answer')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ offerId: 111104, userId: 111101, accepted: false });
    expect(result.status).toEqual(200);
    expect(result.body).toMatchObject({
      id: 111104,
      title: expect.any(String),
      description: expect.any(String),
      available: true,
      limit: 5,
      ownerId: 111100,
      skillId: 11150,
      status: 1,
      participants: [],
      applicants: [],
    });
  });
  it('Should not be able to accept nonexisting applicant', async () => {
    const result = await request(app.getHttpServer())
      .patch('/actions/answer')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ offerId: 111104, userId: 997, accepted: true });
    expect(result.status).toEqual(404);
    expect(result.body.message).toEqual('User with id 997 not found!');
  });
  it('Should not be able to accept applicant if user did not apply', async () => {
    const result = await request(app.getHttpServer())
      .patch('/actions/answer')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ offerId: 111105, userId: 111100, accepted: true });
    expect(result.status).toEqual(400);
    expect(result.body.message).toEqual(
      'User with id: 111100 did not apply for offer of id: 111105!',
    );
  });
  it('Should not be able to accept applicant for nonexisting offer', async () => {
    const result = await request(app.getHttpServer())
      .patch('/actions/answer')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ offerId: 111115, userId: 111100, accepted: true });
    expect(result.status).toEqual(404);
    expect(result.body.message).toEqual('Offer with id 111115 not found!');
  });

  it('Should not be able to accept applicant for unavailable offer', async () => {
    const result = await request(app.getHttpServer())
      .patch('/actions/answer')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ offerId: 111106, userId: 111100, accepted: true });
    expect(result.status).toEqual(400);
    expect(result.body.message).toEqual(
      'Offer with id 111106 no longer available!',
    );
  });
  it('Should not be able to accept applicant for offer that reached limit', async () => {
    const result = await request(app.getHttpServer())
      .patch('/actions/answer')
      .set('Authorization', `Bearer ${token}`)
      .send({ offerId: 111107, userId: 111100, accepted: true });
    expect(result.status).toEqual(400);
    expect(result.body.message).toEqual(
      'Offer of id 111107 has already reached max limit of 1!',
    );
  });
  it('Should not be able to accept applicant for other user', async () => {
    const result = await request(app.getHttpServer())
      .patch('/actions/answer')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ offerId: 11129, userId: 11144, accepted: true });
    expect(result.status).toEqual(403);
    expect(result.body.message).toBe('User with id: 111100 is unauthorized!');
  });
  it('Should be albe to remove participant as user', async () => {
    const result = await request(app.getHttpServer())
      .patch('/actions/remove')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ offerId: 111108, userId: 11142 });
    expect(result.status).toEqual(200);
    result.body.participants.forEach((participant) => {
      expect(participant.id).not.toEqual(11142);
    });
  });
  it('Should not be albe to remove participant from other user offer as user', async () => {
    const result = await request(app.getHttpServer())
      .patch('/actions/remove')
      .set('Authorization', `Bearer ${limitToken}`)
      .send({ offerId: 111108, userId: 11140 });
    expect(result.status).toEqual(403);
    expect(result.body.message).toEqual('User with id: 11144 is unauthorized!');
  });
  it('Should be albe to remove participant as admin', async () => {
    const result = await request(app.getHttpServer())
      .patch('/actions/remove')
      .set('Authorization', `Bearer ${token}`)
      .send({ offerId: 111108, userId: 11140 });
    expect(result.status).toEqual(200);
    result.body.participants.forEach((participant) => {
      expect(participant.id).not.toEqual(11140);
    });
  });
  it('Should return error if offer does not exist', async () => {
    const result = await request(app.getHttpServer())
      .patch('/actions/remove')
      .set('Authorization', `Bearer ${token}`)
      .send({ offerId: 111188, userId: 11140 });
    expect(result.status).toEqual(404);
    expect(result.body.message).toEqual('Offer with id 111188 not found!');
  });
  it('Should return error if user does not exist', async () => {
    const result = await request(app.getHttpServer())
      .patch('/actions/remove')
      .set('Authorization', `Bearer ${token}`)
      .send({ offerId: 111108, userId: 997 });
    expect(result.status).toEqual(404);
    expect(result.body.message).toEqual('User with id 997 not found!');
  });
});
