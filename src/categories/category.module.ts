import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Skill } from './../skills/skill.entity';
import { CategoryController } from './category.controller';
import { Category } from './category.entity';
import { CategoryService } from './category.service';

@Module({
  imports: [TypeOrmModule.forFeature([Skill, Category])],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
