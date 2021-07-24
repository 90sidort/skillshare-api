import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { Category } from './../categories/category.entity';
import { Offer } from './../offer/offer.entity';
import { Skill } from './../skills/skill.entity';
import { User } from './../user/user.entity';
import { Review } from './../review/review.entity';

export default registerAs(
  'orm.config',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [Skill, Offer, User, Category, Review],
    synchronize: true,
    dropSchema: process.env.DB_DROP === 'true' ? true : false,
  }),
);
