import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { User } from './user.entity';
import { UsersController } from './user.controller';
import { UserService } from './user.service';
import { JwtStrategy } from './authentication/jwt.strategy';
import { LocalStrategy } from './authentication/local.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.secret,
        signOptions: { expiresIn: '12h' },
      }),
    }),
  ],
  providers: [UserService, JwtStrategy, LocalStrategy],
  controllers: [UsersController],
})
export class UserModule {}
