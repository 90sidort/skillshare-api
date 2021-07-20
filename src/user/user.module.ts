import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { User } from './user.entity';
import { UsersController } from './user.controller';
import { UserService } from './user.service';
import { JwtStrategy } from './authentication/jwt.strategy';
import { LocalStrategy } from './authentication/local.strategy';
import { ActionController } from './actions/action.controller';
import { Offer } from 'src/offer/offer.entity';
import { OfferService } from 'src/offer/offer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Offer]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.secret,
        signOptions: { expiresIn: '12h' },
      }),
    }),
  ],
  providers: [UserService, JwtStrategy, LocalStrategy, OfferService],
  controllers: [UsersController, ActionController],
})
export class UserModule {}
