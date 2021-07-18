import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { AuthModule } from './auth/auth.modul';
import { CategoryModule } from './categories/category.module';
import ormConfig from './config/orm.config';
import { OfferModule } from './offer/offer.module';
import { SkillsModule } from './skills/skills.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [ormConfig],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: ormConfig,
    }),
    // AuthModule,
    SkillsModule,
    OfferModule,
    CategoryModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
