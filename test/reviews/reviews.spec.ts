import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection } from 'typeorm';
import * as request from 'supertest';

import { AppModule } from '../../src/app.module';
import loadFixture from '../fixtures/loadFixtures';
import getToken from '../fixtures/token.mock';
import { Role } from './../../src/user/authorization/role.enum';
import {
  newReviewInvalid,
  newReviewRating,
  newReviewText,
  newReviewTextChanged,
} from './reviews.mocks';

let app: INestApplication;
let mod: TestingModule;
let connection: Connection;

describe('E2E reviews tests', () => {
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
    await loadFixture(connection, '_review_.sql');
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
  it('Should be able to create review with rating only', async () => {
    const result = await request(app.getHttpServer())
      .post('/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send(newReviewRating);
    expect(result.status).toEqual(201);
  });
  it('Should be able to create review with text', async () => {
    const result = await request(app.getHttpServer())
      .post('/reviews')
      .set('Authorization', `Bearer ${userToken}`)
      .send(newReviewText);
    expect(result.status).toEqual(201);
  });
  it('Should be able to create review for yourself', async () => {
    const result = await request(app.getHttpServer())
      .post('/reviews')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...newReviewText, reviewedId: 111100 });
    expect(result.status).toEqual(400);
    expect(result.body.message).toEqual('You cannot review yourself!');
  });
  it('Should not be able to create review without mandatory data', async () => {
    const result = await request(app.getHttpServer())
      .post('/reviews')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});
    expect(result.status).toEqual(400);
    expect(result.body.message).toEqual([
      'Title cannot be shorter than 3 characters and longer than 400!',
      'Rating cannot be greater than 10',
      'Rating cannot be less than 1',
      'Rating must be a number',
      'Reviewd id must be a number',
    ]);
  });
  it('Should not be able to create review with invalid data', async () => {
    const result = await request(app.getHttpServer())
      .post('/reviews')
      .set('Authorization', `Bearer ${userToken}`)
      .send(newReviewInvalid);
    expect(result.status).toEqual(400);
    expect(result.body.message).toEqual([
      'Title cannot be shorter than 3 characters and longer than 400!',
      'Review cannot be shorter than 3 characters and longer than 3000!',
      'Rating cannot be greater than 10',
      'Reviewd id must be a number',
    ]);
  });
  it('Should not be able to create review for user that does not exist', async () => {
    const result = await request(app.getHttpServer())
      .post('/reviews')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...newReviewText, reviewedId: 9999999 });
    expect(result.status).toEqual(400);
    expect(result.body.message).toEqual('User with id: 9999999 not found!');
  });
  it('Should be able to get reviews as admin', async () => {
    const result = await request(app.getHttpServer())
      .get('/reviews')
      .set('Authorization', `Bearer ${token}`);
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
      rating: expect.any(Number),
      review: null,
      status: expect.any(Number),
    });
  });
  it('Should be able to get reviews as user', async () => {
    const result = await request(app.getHttpServer())
      .get('/reviews')
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
      rating: expect.any(Number),
      review: null,
      status: expect.any(Number),
    });
  });
  it('Should be able to search reviews', async () => {
    const result = await request(app.getHttpServer())
      .get('/reviews?title=Sharable background&authorId=11199&reviewedId=11110')
      .set('Authorization', `Bearer ${userToken}`);
    expect(result.body.data.length).toEqual(1);
    expect(result.body.data[0]).toMatchObject({
      id: expect.any(Number),
      title: expect.any(String),
      rating: expect.any(Number),
      review: null,
      status: expect.any(Number),
    });
  });
  it('Should return empty list if no review match search', async () => {
    const result = await request(app.getHttpServer())
      .get('/reviews?title=Sharable background&authorId=11199&reviewedId=89898')
      .set('Authorization', `Bearer ${token}`);
    expect(result.body.data.length).toEqual(0);
  });
  it('Should be able to get review skill by id as user', async () => {
    const result = await request(app.getHttpServer())
      .get('/reviews/2001')
      .set('Authorization', `Bearer ${userToken}`);
    expect(result.status).toEqual(200);
    expect(result.body).toMatchObject({
      id: 2001,
      title: 'Sharable background data-warehouse',
      review: null,
      rating: 1,
      status: 1,
    });
  });
  it('Should be able to get single review by id as admin', async () => {
    const result = await request(app.getHttpServer())
      .get('/reviews/2001')
      .set('Authorization', `Bearer ${token}`);
    expect(result.status).toEqual(200);
    expect(result.body).toMatchObject({
      id: 2001,
      title: 'Sharable background data-warehouse',
      review: null,
      rating: 1,
      status: 1,
    });
  });
  it('Should return error if review id does not exist', async () => {
    const result = await request(app.getHttpServer())
      .get('/reviews/2138')
      .set('Authorization', `Bearer ${token}`);
    expect(result.status).toEqual(400);
    expect(result.body.message).toEqual('Failed to find review with id 2138');
  });
  it('Should be able to update review', async () => {
    const result = await request(app.getHttpServer())
      .patch('/reviews/2090')
      .set('Authorization', `Bearer ${userToken}`)
      .send(newReviewTextChanged);
    expect(result.status).toEqual(200);
    expect(result.body).toEqual(
      expect.objectContaining({
        id: 2090,
        title: 'New test review with changed text',
        rating: 2,
        status: 2,
        review:
          'This is a review body. This review is just a test review, so do not think much of it. But its changed.',
      }),
    );
  });
  it('Should not be able to update sb else review', async () => {
    const result = await request(app.getHttpServer())
      .patch('/reviews/2089')
      .set('Authorization', `Bearer ${userToken}`)
      .send(newReviewTextChanged);
    expect(result.status).toEqual(401);
    expect(result.body.message).toEqual(
      'Unauthorized to update review id 2089',
    );
  });
  it('Should be able to update sb else review as admin', async () => {
    const result = await request(app.getHttpServer())
      .patch('/reviews/2089')
      .set('Authorization', `Bearer ${token}`)
      .send(newReviewTextChanged);
    expect(result.status).toEqual(200);
    expect(result.body).toEqual(
      expect.objectContaining({
        id: 2089,
        title: 'New test review with changed text',
        rating: 2,
        status: 2,
        review:
          'This is a review body. This review is just a test review, so do not think much of it. But its changed.',
      }),
    );
  });
  it('Should not be able to update review with no mandatory data', async () => {
    const result = await request(app.getHttpServer())
      .patch('/reviews/2089')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(result.status).toEqual(400);
    expect(result.body.message).toEqual('No updates for review id 2089');
  });
  it('Should not be able to update review with invalid data', async () => {
    const result = await request(app.getHttpServer())
      .patch('/reviews/2089')
      .set('Authorization', `Bearer ${token}`)
      .send(newReviewInvalid);
    expect(result.status).toEqual(400);
    expect(result.body.message).toEqual([
      'Title cannot be shorter than 3 characters and longer than 400!',
      'Review cannot be shorter than 3 characters and longer than 3000!',
      'Rating cannot be greater than 10',
      'Reviewd id must be a number',
    ]);
  });
  it('Should be able to delete review as user', async () => {
    const result = await request(app.getHttpServer())
      .delete('/reviews/2088')
      .set('Authorization', `Bearer ${userToken}`);
    expect(result.status).toEqual(204);
  });
  it('Should be able to delete review as admin', async () => {
    const result = await request(app.getHttpServer())
      .delete('/reviews/2073')
      .set('Authorization', `Bearer ${token}`);
    expect(result.status).toEqual(204);
  });
  it('Should not be able to delete review of sb else as user', async () => {
    const result = await request(app.getHttpServer())
      .delete('/reviews/2060')
      .set('Authorization', `Bearer ${userToken}`);
    expect(result.body.message).toEqual(
      'Unauthorized to delete review with id 2060!',
    );
    expect(result.status).toEqual(401);
  });
  it('Should not be able to delete nonexistent review', async () => {
    const result = await request(app.getHttpServer())
      .delete('/reviews/201260')
      .set('Authorization', `Bearer ${token}`);
    expect(result.body.message).toEqual('Review with id 201260 not found!');
    expect(result.status).toEqual(404);
  });
});
