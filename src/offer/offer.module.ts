import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Offer } from './offer.entity';
import { OfferController } from './offer.controllers';
import { User } from 'src/user/user.entity';
import { Skill } from 'src/skills/skill.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Offer, User, Skill])],
  controllers: [OfferController],
})
export class OfferModule {}
