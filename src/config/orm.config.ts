import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Category } from 'src/categories/category.entity';
import { Offer } from 'src/offer/offer.entity';
import { Profile } from 'src/profile/profile.entity';
import { Skill } from 'src/skills/skill.entity';
import { User } from 'src/user/user.entity';

export default registerAs(
  'orm.config',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [Skill, Offer, User, Profile, Category],
    synchronize: true,
  }),
);
