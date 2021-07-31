import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection } from 'typeorm';
import * as request from 'supertest';

import { AppModule } from '../../src/app.module';
import loadFixture from '../fixtures/loadFixtures';
import getToken from '../fixtures/token.mock';
// import {
//   newCategory,
//   newCategoryChange,
//   newCategoryLong,
//   newCategoryShort,
// } from './category.mocks';
import { Role } from './../../src/user/authorization/role.enum';
import { newOffer } from './offer.mocks';

let app: INestApplication;
let mod: TestingModule;
let connection: Connection;

describe('E2E offers tests', () => {
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
    await loadFixture(connection, '_offer_.sql');
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
  it('Should be able to create offer', async () => {
    const result = await request(app.getHttpServer())
      .post('/offer')
      .set('Authorization', `Bearer ${userToken}`)
      .send(newOffer);
    expect(result.status).toEqual(201);
  });
  it('Should not be able to create offer with no mandatory data', async () => {
    const result = await request(app.getHttpServer())
      .post('/offer')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});
    expect(result.status).toEqual(400);
    expect(result.body.message).toEqual([
      'Title cannot be shorter than 3 characters and longer than 300!',
      'Description cannot be shorter than 3 characters and longer than 2000!',
      'Limit cannot be greater than 10',
      'Limit cannot be less than 1',
      'Limit must be a number',
    ]);
  });
  it('Should not be able to create offer with invalid skill id', async () => {
    const result = await request(app.getHttpServer())
      .post('/offer')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...newOffer, skillId: 997 });
    expect(result.status).toEqual(404);
    expect(result.body.message).toEqual('Failed to fetch skill of id: 997');
  });
  it('Should not be able to create offer with invalid data', async () => {
    const result = await request(app.getHttpServer())
      .post('/offer')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        ...newOffer,
        title: 'aa'.repeat(500),
        description: 'bb',
        limit: 'a',
      });
    expect(result.status).toEqual(400);
    expect(result.body.message).toEqual([
      'Title cannot be shorter than 3 characters and longer than 300!',
      'Description cannot be shorter than 3 characters and longer than 2000!',
      'Limit cannot be greater than 10',
      'Limit cannot be less than 1',
      'Limit must be a number',
    ]);
  });
  it('Should be able to get offers', async () => {
    const result = await request(app.getHttpServer())
      .get('/offer')
      .set('Authorization', `Bearer ${userToken}`);
    expect(result.status).toEqual(200);
    expect(result.body.data.length).toBeGreaterThan(1);
    expect(result.body).toMatchObject({
      first: expect.any(Number),
      last: expect.any(Number),
      limit: expect.any(Number),
      total: expect.any(Number),
    });
    expect(result.body.data[0]).toMatchObject({
      id: expect.any(Number),
      title: expect.any(String),
      description: expect.any(String),
      limit: expect.any(Number),
      ownerId: expect.any(Number),
      skillId: expect.any(Number),
      status: expect.any(Number),
      applicantCount: expect.any(Number),
      participantCount: expect.any(Number),
    });
  });
  it('Should be able to search offers', async () => {
    const result = await request(app.getHttpServer())
      .get('/offer?ownerId=11112&title=rea&skillId=11112&limit=5&currentPage=1')
      .set('Authorization', `Bearer ${userToken}`);
    expect(result.status).toEqual(200);
    expect(result.body.data.length).toEqual(1);
    expect(result.body).toMatchObject({
      first: expect.any(Number),
      last: expect.any(Number),
      limit: expect.any(String),
      total: expect.any(Number),
    });
    expect(result.body.data[0]).toMatchObject({
      id: 11112,
      title: 'Reactive',
      description:
        'In hac habitasse platea dictumst. Maecenas ut massa quis augue luctus tincidunt.',
      available: true,
      limit: 2,
      ownerId: 11112,
      skillId: 11112,
      status: 2,
      applicantCount: 0,
      participantCount: 0,
    });
  });
  it('Should return empty array if no offers match search', async () => {
    const result = await request(app.getHttpServer())
      .get(
        '/offer?ownerId=11112&title=nonexist&skillId=11112&limit=5&currentPage=1',
      )
      .set('Authorization', `Bearer ${userToken}`);
    expect(result.status).toEqual(200);
    expect(result.body.data.length).toEqual(0);
    expect(result.body).toMatchObject({
      first: expect.any(Number),
      last: expect.any(Number),
      limit: expect.any(String),
      total: expect.any(Number),
    });
    expect(result.body.data).toEqual([]);
  });
  it('Should be able to get single offer by id', async () => {
    const result = await request(app.getHttpServer())
      .get('/offer/1111')
      .set('Authorization', `Bearer ${userToken}`);
    expect(result.status).toEqual(200);
    expect(result.body).toMatchObject({
      id: 1111,
      title: 'Down-sized',
      description:
        'Pellentesque viverra pede ac diam. Cras pellentesque volutpat dui. Maecenas tristique, est et tempus semper, est quam pharetra magna, ac consequat metus sapien ut nunc. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae Mauris viverra diam vitae quam.',
      available: true,
      limit: 5,
      ownerId: 1111,
      skillId: 1111,
      status: 2,
      skill: { id: 1111, name: 'Programmable' },
      owner: { id: 1111, username: 'emiche0', email: 'emiche0@umn.edu' },
      participants: [],
      applicants: [],
      applicantCount: 0,
      participantCount: 0,
    });
  });
  it('Should return error if id of offer is incorrect', async () => {
    const result = await request(app.getHttpServer())
      .get('/offer/997')
      .set('Authorization', `Bearer ${userToken}`);
    expect(result.status).toEqual(404);
    expect(result.body.message).toEqual('Offer with id 997 not found!');
  });
  it('Should be able to update offer as user', async () => {
    const result = await request(app.getHttpServer())
      .patch('/offer/111101')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...newOffer, available: false, status: '2' });
    expect(result.status).toEqual(200);
    expect(result.body).toMatchObject({
      id: 111101,
      title: 'New test offer',
      description:
        'New offer description text. Describe what you want to teach other people or something like this.',
      available: false,
      limit: 1,
      ownerId: 111100,
      skillId: expect.any(Number),
      status: '2',
      skill: {},
    });
  });
  it('Should not be able to update offer of other user as user', async () => {
    const result = await request(app.getHttpServer())
      .patch('/offer/111100')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...newOffer, available: false, status: '2' });
    expect(result.status).toEqual(403);
    expect(result.body.message).toEqual(
      'Unauthorized to change offer with id 111100',
    );
  });
  it('Should be able to update offer as admin', async () => {
    const result = await request(app.getHttpServer())
      .patch('/offer/11199')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...newOffer, available: false, status: '2' });
    expect(result.status).toEqual(200);
    expect(result.body).toMatchObject({
      id: 11199,
      title: 'New test offer',
      description:
        'New offer description text. Describe what you want to teach other people or something like this.',
      available: false,
      limit: 6,
      ownerId: 11149,
      skillId: expect.any(Number),
      status: '2',
      skill: {},
    });
  });
  it('Should not be able to update offer with invalid id', async () => {
    const result = await request(app.getHttpServer())
      .patch('/offer/997')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...newOffer, available: false, status: '2' });
    expect(result.status).toEqual(404);
    expect(result.body.message).toEqual('Failed to fetch offer with id 997');
  });
  it('Should not be able to update offer with invalid skill id', async () => {
    const result = await request(app.getHttpServer())
      .patch('/offer/11186')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...newOffer, skillId: 997 });
    expect(result.status).toEqual(404);
    expect(result.body.message).toEqual('Failed to fetch skill with id 997');
  });
  it('Should return skill as it was if no updates were sent', async () => {
    const result = await request(app.getHttpServer())
      .patch('/offer/11186')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(result.status).toEqual(200);
    expect(result.body).toMatchObject({
      id: 11186,
      title: 'Assimilated',
      description:
        'Morbi odio odio, elementum eu, interdum eu, tincidunt in, leo. Maecenas pulvinar lobortis est. Phasellus sit amet erat. Nulla tempus.',
      available: true,
      limit: 8,
      ownerId: 11136,
      skillId: 11136,
      status: 2,
    });
  });
  it('Should return error if invalid update data was sent', async () => {
    const result = await request(app.getHttpServer())
      .patch('/offer/11186')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...newOffer,
        title: 'aa'.repeat(500),
        description: 'bb',
        limit: 'a',
        available: 'abc',
      });
    expect(result.status).toEqual(400);
    expect(result.body.message).toEqual([
      'Available status must be a boolean',
      'Title cannot be shorter than 3 characters and longer than 300!',
      'Description cannot be shorter than 3 characters and longer than 2000!',
      'Limit cannot be greater than 10',
      'Limit cannot be less than 1',
      'Limit must be a number',
    ]);
  });
});
