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
  //   it('Should be able to create review with rating only', async () => {
  //     const result = await request(app.getHttpServer())
  //       .post('/reviews')
  //       .set('Authorization', `Bearer ${token}`)
  //       .send(newReviewRating);
  //     expect(result.status).toEqual(201);
  //   });
  //   it('Should be able to create review with text', async () => {
  //     const result = await request(app.getHttpServer())
  //       .post('/reviews')
  //       .set('Authorization', `Bearer ${userToken}`)
  //       .send(newReviewText);
  //     expect(result.status).toEqual(201);
  //   });
  //   it('Should be able to create review for yourself', async () => {
  //     const result = await request(app.getHttpServer())
  //       .post('/reviews')
  //       .set('Authorization', `Bearer ${userToken}`)
  //       .send({ ...newReviewText, reviewedId: 111100 });
  //     expect(result.status).toEqual(400);
  //     expect(result.body.message).toEqual('You cannot review yourself!');
  //   });
  //   it('Should not be able to create review without mandatory data', async () => {
  //     const result = await request(app.getHttpServer())
  //       .post('/reviews')
  //       .set('Authorization', `Bearer ${userToken}`)
  //       .send({});
  //     expect(result.status).toEqual(400);
  //     expect(result.body.message).toEqual([
  //       'Title cannot be shorter than 3 characters and longer than 400!',
  //       'Rating cannot be greater than 10',
  //       'Rating cannot be less than 1',
  //       'Rating must be a number',
  //       'Reviewd id must be a number',
  //     ]);
  //   });
  //   it('Should not be able to create review with invalid data', async () => {
  //     const result = await request(app.getHttpServer())
  //       .post('/reviews')
  //       .set('Authorization', `Bearer ${userToken}`)
  //       .send(newReviewInvalid);
  //     expect(result.status).toEqual(400);
  //     expect(result.body.message).toEqual([
  //       'Title cannot be shorter than 3 characters and longer than 400!',
  //       'Review cannot be shorter than 3 characters and longer than 3000!',
  //       'Rating cannot be greater than 10',
  //       'Reviewd id must be a number',
  //     ]);
  //   });
  //   it('Should not be able to create review for user that does not exist', async () => {
  //     const result = await request(app.getHttpServer())
  //       .post('/reviews')
  //       .set('Authorization', `Bearer ${userToken}`)
  //       .send({ ...newReviewText, reviewedId: 9999999 });
  //     expect(result.status).toEqual(400);
  //     expect(result.body.message).toEqual('User with id: 9999999 not found!');
  //   });
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
  //   it('Should return error if skill id does not exist', async () => {
  //     const result = await request(app.getHttpServer())
  //       .get('/skills/999')
  //       .set('Authorization', `Bearer ${token}`);
  //     expect(result.status).toEqual(400);
  //     expect(result.body.message).toEqual('Failed to find skill of id 999');
  //   });
  //   it('Should be able to update skill', async () => {
  //     const result = await request(app.getHttpServer())
  //       .patch('/skills/1111')
  //       .set('Authorization', `Bearer ${token}`)
  //       .send(newSkillChange);
  //     expect(result.status).toEqual(200);
  //     expect(result.body).toMatchObject({
  //       id: expect.any(Number),
  //       name: 'New Skill',
  //       description: 'changed description',
  //       categoryId: expect.any(Number),
  //       offersCount: expect.any(Number),
  //       offersPending: expect.any(Number),
  //       offersAccepted: expect.any(Number),
  //     });
  //   });
  //   it('Should not be able to update skill if invalid input', async () => {
  //     const result = await request(app.getHttpServer())
  //       .patch('/skills/1111')
  //       .set('Authorization', `Bearer ${token}`)
  //       .send(newSkillInvalid);
  //     expect(result.status).toEqual(400);
  //     expect(result.body.message).toEqual([
  //       'Name needs at least 3 characters, up to 200 characters!',
  //       'Description needs at least 3 characters, up to 400 characters!',
  //     ]);
  //   });
  //   it('Should not be able to update skill if invalid skill', async () => {
  //     const result = await request(app.getHttpServer())
  //       .patch('/skills/999')
  //       .set('Authorization', `Bearer ${token}`)
  //       .send(newSkillChange);
  //     expect(result.status).toEqual(400);
  //     expect(result.body.message).toEqual('Failed to fetch skill with id 999');
  //   });
  //   it('Should not be able to update skill if invalid category', async () => {
  //     const result = await request(app.getHttpServer())
  //       .patch('/skills/1111')
  //       .set('Authorization', `Bearer ${token}`)
  //       .send(newSkillInvalidCat);
  //     expect(result.status).toEqual(400);
  //   });
  //   it('Should not be able to update skill as user', async () => {
  //     const result = await request(app.getHttpServer())
  //       .patch('/skills/1111')
  //       .set('Authorization', `Bearer ${userToken}`)
  //       .send(newSkillChange);
  //     expect(result.status).toEqual(401);
  //     expect(result.body.message).toEqual('Unauthorized!!!');
  //   });
  //   it('Should be able to delete skill', async () => {
  //     const result = await request(app.getHttpServer())
  //       .delete('/skills/111101')
  //       .set('Authorization', `Bearer ${token}`);
  //     expect(result.status).toEqual(204);
  //   });
  //   it('Should not be able to delete skill with offers', async () => {
  //     const result = await request(app.getHttpServer())
  //       .delete('/skills/11150')
  //       .set('Authorization', `Bearer ${token}`);
  //     expect(result.status).toEqual(400);
  //     expect(result.body.message).toEqual(
  //       `Cannot delete skill of id 11150 with active offers`,
  //     );
  //   });
  //   it('Should return error if skill to be deleted does not exist', async () => {
  //     const result = await request(app.getHttpServer())
  //       .delete('/skills/13123123')
  //       .set('Authorization', `Bearer ${token}`);
  //     expect(result.status).toEqual(404);
  //     expect(result.body.message).toEqual('Skill with id 13123123 not found!');
  //   });
  //   it('Should not be able to delete skill as user', async () => {
  //     const result = await request(app.getHttpServer())
  //       .delete('/skills/111100')
  //       .set('Authorization', `Bearer ${userToken}`);
  //     expect(result.status).toEqual(401);
  //     expect(result.body.message).toEqual('Unauthorized!!!');
  //   });
});
