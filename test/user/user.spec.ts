import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Any, Connection } from 'typeorm';
import * as request from 'supertest';

import { AppModule } from '../../src/app.module';
import loadFixture from '../fixtures/loadFixtures';
import getToken from '../fixtures/token.mock';
import { Role } from './../../src/user/authorization/role.enum';
import {
  signinUser,
  signupUser,
  signupUserInvalid,
  updateUser,
} from './user.mocks';

let app: INestApplication;
let mod: TestingModule;
let connection: Connection;

describe('E2E user tests', () => {
  let token;
  let userToken;
  let changedToken;
  let deleteToken;
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
    changedToken = getToken(
      {
        id: 11199,
        username: 'sayling2q',
        roles: [Role.User],
      },
      app,
    );
    deleteToken = getToken(
      {
        id: 11173,
        username: 'ocuddihy20',
        roles: [Role.User],
      },
      app,
    );
  });

  afterAll(async () => {
    await app.close();
  });
  it('Should be able to signin', async () => {
    const result = await request(app.getHttpServer())
      .post('/users/signin')
      .send(signinUser);
    expect(result.status).toEqual(201);
    expect(result.body).toMatchObject({
      userId: expect.any(Number),
      token: expect.any(String),
    });
  });
  it('Should not be able to signin with nonexisting username', async () => {
    const result = await request(app.getHttpServer())
      .post('/users/signin')
      .send({ ...signinUser, username: 'adminadmin' });
    expect(result.status).toEqual(404);
    expect(result.body.message).toEqual(
      'User with username: adminadmin not found!',
    );
  });
  it('Should not be able to signin with invalid password', async () => {
    const result = await request(app.getHttpServer())
      .post('/users/signin')
      .send({ ...signinUser, password: 'testtest88' });
    expect(result.status).toEqual(403);
    expect(result.body.message).toEqual(
      'Provided password does not match accounts password',
    );
  });
  it('Should not be able to signin with no data', async () => {
    const result = await request(app.getHttpServer())
      .post('/users/signin')
      .send({});
    expect(result.body.message).toEqual(
      'User with username: undefined not found!',
    );
    expect(result.status).toEqual(404);
  });
  it('Should be able to signup with valid data', async () => {
    const result = await request(app.getHttpServer())
      .post('/users/signup')
      .send(signupUser);
    expect(result.body).toMatchObject({
      username: expect.any(String),
      name: expect.any(String),
      surname: expect.any(String),
      password: null,
      email: expect.any(String),
      about: expect.any(String),
      id: expect.any(Number),
      createdAt: null,
      updatedAt: null,
      roles: expect.any(String),
      token: expect.any(String),
    });
  });
  it('Should not be able to signup with different passwords', async () => {
    const result = await request(app.getHttpServer())
      .post('/users/signup')
      .send({ ...signupUser, retype: 'else' });
    expect(result.body.message).toEqual('Passwords do not match!');
    expect(result.status).toEqual(400);
  });
  it('Should not be able to signup with already existing email', async () => {
    const result = await request(app.getHttpServer())
      .post('/users/signup')
      .send({ ...signupUser, email: 'test@test.com' });
    expect(result.body.message).toEqual('Username or email already taken!');
    expect(result.status).toEqual(400);
  });
  it('Should not be able to signup with already existing username', async () => {
    const result = await request(app.getHttpServer())
      .post('/users/signup')
      .send({ ...signupUser, username: 'admin' });
    expect(result.body.message).toEqual('Username or email already taken!');
    expect(result.status).toEqual(400);
  });
  it('Should not be able to signup without mandatory data', async () => {
    const result = await request(app.getHttpServer())
      .post('/users/signup')
      .send({});
    expect(result.body.message).toEqual([
      'User name cannot be shorter than 3 characters and longer than 300!',
      'Name cannot be shorter than 3 characters and longer than 300!',
      'Surname cannot be shorter than 3 characters and longer than 300!',
      'Password cannot be shorter than 3 characters and longer than 300!',
      'Password cannot be shorter than 3 characters and longer than 100!',
      'email must be an email',
      'About cannot be shorter than 3 characters and longer than 2000!',
    ]);
    expect(result.status).toEqual(400);
  });
  it('Should not be able to signup without invalid data', async () => {
    const result = await request(app.getHttpServer())
      .post('/users/signup')
      .send(signupUserInvalid);
    expect(result.body.message).toEqual([
      'User name cannot be shorter than 3 characters and longer than 300!',
      'Name cannot be shorter than 3 characters and longer than 300!',
      'Surname cannot be shorter than 3 characters and longer than 300!',
      'Password cannot be shorter than 3 characters and longer than 300!',
      'Password cannot be shorter than 3 characters and longer than 100!',
      'email must be an email',
      'About cannot be shorter than 3 characters and longer than 2000!',
    ]);
    expect(result.status).toEqual(400);
  });
  it('Should be able to get users as user', async () => {
    const result = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${userToken}`);
    expect(result.body.data.length).toBeGreaterThan(1);
    expect(result.body).toMatchObject({
      first: expect.any(Number),
      last: expect.any(Number),
      limit: expect.any(Number),
      total: expect.any(Number),
    });
    expect(result.body.data[0]).toMatchObject({
      id: expect.any(Number),
      username: expect.any(String),
      name: expect.any(String),
      surname: expect.any(String),
      email: expect.any(String),
      about: expect.any(String),
      roles: expect.any(String),
      appliedCount: expect.any(Number),
      offeredCounts: expect.any(Number),
      participatesCount: expect.any(Number),
    });
  });
  it('Should be able to get users as admin', async () => {
    const result = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${token}`);
    expect(result.body.data.length).toBeGreaterThan(1);
    expect(result.body).toMatchObject({
      first: expect.any(Number),
      last: expect.any(Number),
      limit: expect.any(Number),
      total: expect.any(Number),
    });
    expect(result.body.data[0]).toMatchObject({
      id: expect.any(Number),
      username: expect.any(String),
      name: expect.any(String),
      surname: expect.any(String),
      email: expect.any(String),
      about: expect.any(String),
      roles: expect.any(String),
      appliedCount: expect.any(Number),
      offeredCounts: expect.any(Number),
      participatesCount: expect.any(Number),
    });
  });
  it('Should be able to get search users', async () => {
    const result = await request(app.getHttpServer())
      .get('/users?username=kduberry2r&email=kduberry2r')
      .set('Authorization', `Bearer ${userToken}`);
    expect(result.body.data.length).toEqual(1);
    expect(result.body).toMatchObject({
      first: expect.any(Number),
      last: expect.any(Number),
      limit: expect.any(Number),
      total: expect.any(Number),
    });
    expect(result.body.data[0]).toMatchObject({
      id: 111100,
      username: 'kduberry2r',
      name: 'Kyle',
      surname: 'Duberry',
      email: 'kduberry2r@opensource.org',
      about:
        'Sed sagittis. Nam congue, risus semper porta volutpat, quam pede lobortis ligula, sit amet eleifend pede libero quis orci. Nullam molestie nibh in lectus.',
      roles: 'user',
      appliedCount: expect.any(Number),
      offeredCounts: expect.any(Number),
      participatesCount: expect.any(Number),
    });
  });
  it('Should return empty list if no user matches search query', async () => {
    const result = await request(app.getHttpServer())
      .get('/users?username=aaaaaa&email=adasdasdas&limit=10&currentPage=1')
      .set('Authorization', `Bearer ${userToken}`);
    expect(result.body).toMatchObject({
      first: expect.any(Number),
      last: expect.any(Number),
      limit: expect.any(String),
      total: expect.any(Number),
    });
    expect(result.body.data).toEqual([]);
  });
  it('Should be able to get user by id', async () => {
    const result = await request(app.getHttpServer())
      .get('/users/11199')
      .set('Authorization', `Bearer ${userToken}`);
    expect(result.body).toMatchObject({
      id: 11199,
      username: 'sayling2q',
      name: 'Saraann',
      surname: 'Ayling',
      email: 'sayling2q@kickstarter.com',
      about:
        'Mauris ullamcorper purus sit amet nulla. Quisque arcu libero, rutrum ac, lobortis vel, dapibus at, diam. Nam tristique tortor eu pede.',
      roles: 'user',
      appliedCount: expect.any(Number),
      offeredCounts: expect.any(Number),
      participatesCount: expect.any(Number),
      offers: expect.any(Array),
      participates: expect.any(Array),
      applied: expect.any(Array),
    });
  });
  it('Should not be able to get nonexisting user by id', async () => {
    const result = await request(app.getHttpServer())
      .get('/users/99')
      .set('Authorization', `Bearer ${userToken}`);
    expect(result.body.message).toEqual('User with id: 99 does not exist');
    expect(result.status).toEqual(404);
  });
  it('Should be able to update user data', async () => {
    const result = await request(app.getHttpServer())
      .patch('/users/11199')
      .send(updateUser)
      .set('Authorization', `Bearer ${changedToken}`);
    expect(result.body).toMatchObject({
      id: 11199,
      username: 'sayling2q',
      name: 'Changed name',
      surname: 'Changed surname',
      email: 'wolny@email.com',
      about: 'Dis is a short test. So lets check if it works!',
      roles: 'user',
    });
    expect(result.status).toEqual(200);
  });
  it('Should not be able to update password without providing old one', async () => {
    const result = await request(app.getHttpServer())
      .patch('/users/111100')
      .send({ ...updateUser, password: undefined })
      .set('Authorization', `Bearer ${userToken}`);
    expect(result.status).toEqual(403);
    expect(result.body.message).toEqual(
      'Cannot update password without providing old one',
    );
  });
  it('Should not be able to update password without providing old one', async () => {
    const result = await request(app.getHttpServer())
      .patch('/users/111100')
      .send({ ...updateUser, password: 'incorrect' })
      .set('Authorization', `Bearer ${userToken}`);
    expect(result.status).toEqual(403);
    expect(result.body.message).toEqual(
      'Provided password does not match accounts password',
    );
  });
  it('Should not be able to update password if retype is incorrect', async () => {
    const result = await request(app.getHttpServer())
      .patch('/users/111100')
      .send({ ...updateUser, retypeNewPassword: undefined })
      .set('Authorization', `Bearer ${userToken}`);
    expect(result.status).toEqual(403);
    expect(result.body.message).toEqual('Passwords do not match');
  });
  it('Should not be able to update email if user with such email already exists in the database', async () => {
    const result = await request(app.getHttpServer())
      .patch('/users/111100')
      .send({ ...updateUser, email: 'kduberry2r@opensource.org' })
      .set('Authorization', `Bearer ${userToken}`);
    expect(result.status).toEqual(400);
    expect(result.body.message).toEqual(
      'Email kduberry2r@opensource.org is taken. Use another email!',
    );
  });
  it('Should not be able to update user with invalid data', async () => {
    const result = await request(app.getHttpServer())
      .patch('/users/111100')
      .send({
        ...updateUser,
        name: 'aa',
        surname: 'bb'.repeat(300),
        email: 'invalidMail',
        about: 'a',
      })
      .set('Authorization', `Bearer ${userToken}`);
    expect(result.status).toEqual(400);
    expect(result.body.message).toEqual([
      'Name cannot be shorter than 3 characters and longer than 300!',
      'Surname cannot be shorter than 3 characters and longer than 300!',
      'email must be an email',
      'About cannot be shorter than 3 characters and longer than 2000!',
    ]);
  });
  it('Should not be able to update other user as user', async () => {
    const result = await request(app.getHttpServer())
      .patch('/users/11199')
      .send(updateUser)
      .set('Authorization', `Bearer ${userToken}`);
    expect(result.status).toEqual(403);
    expect(result.body.message).toEqual(
      'Unauthorized to update user with id 11199',
    );
  });
  it('Should be able to update other user as admin', async () => {
    const result = await request(app.getHttpServer())
      .patch('/users/11199')
      .send({
        ...updateUser,
        email: 'otheremail@test.com',
        name: 'otherChange',
        password: undefined,
        newPassword: undefined,
        retypeNewPassword: undefined,
      })
      .set('Authorization', `Bearer ${token}`);
    expect(result.status).toEqual(200);
    expect(result.body).toMatchObject({
      id: 11199,
      username: 'sayling2q',
      name: 'otherChange',
      surname: expect.any(String),
      email: expect.any(String),
      about: expect.any(String),
      roles: 'user',
    });
  });
  it('Should be able to delete user account', async () => {
    const result = await request(app.getHttpServer())
      .delete('/users/11173')
      .set('Authorization', `Bearer ${deleteToken}`);
    expect(result.status).toEqual(204);
  });
  it('Should not be able to delete other user account as user', async () => {
    const result = await request(app.getHttpServer())
      .delete('/users/11110')
      .set('Authorization', `Bearer ${changedToken}`);
    expect(result.status).toEqual(403);
    expect(result.body.message).toEqual(
      'Unauthorized to delete user with id 11110',
    );
  });
  it('Should be able to delete other user account as admin', async () => {
    const result = await request(app.getHttpServer())
      .delete('/users/11171')
      .set('Authorization', `Bearer ${token}`);
    expect(result.status).toEqual(204);
  });
  it('Should not be able to delete nonexisting user account', async () => {
    const result = await request(app.getHttpServer())
      .delete('/users/112')
      .set('Authorization', `Bearer ${token}`);
    expect(result.status).toEqual(404);
    expect(result.body.message).toEqual('User with id 112 not found!');
  });
});
