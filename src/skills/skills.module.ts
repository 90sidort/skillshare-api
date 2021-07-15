import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from 'src/categories/category.entity';
import { Offer } from 'src/offer/offer.entity';
import { Skill } from './skill.entity';
import { SkillsController } from './skills.controllers';
// import { SkillsService } from './skills.service';

@Module({
  imports: [TypeOrmModule.forFeature([Skill, Offer, Category])],
  controllers: [SkillsController],
  // providers: [SkillsService],
})
export class SkillsModule {}
