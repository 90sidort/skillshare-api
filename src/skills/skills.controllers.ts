import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Offer } from 'src/offer/offer.entity';
import { CreateSkillDto, skillSearchQuery, UpdateSkillDto } from './skill.dto';
import { Skill } from './skill.entity';
// import { SkillsService } from './skills.service';
import { Category } from 'src/categories/category.entity';
import { HttpException } from '@nestjs/common';
import { SkillsService } from './skills.service';

@Controller('/skills')
export class SkillsController {
  constructor(
    @InjectRepository(Skill)
    private readonly repository: Repository<Skill>,
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly skillsService: SkillsService,
  ) {}

  @Post()
  async addSkill(@Body() input: CreateSkillDto) {
    try {
      const { name, catId, description } = input;
      const category = await this.categoryRepository.findOne(catId);
      if (!category)
        throw new HttpException(`Failed to fetch category with ${catId}`, 404);
      const skill = new Skill();
      skill.name = name;
      skill.category = category;
      skill.description = description;
      await this.repository.save(skill);
      return skill;
    } catch (err) {
      throw new HttpException(
        err.response ? err.response : `Failed to create skill`,
        400,
      );
    }
  }
  @Get()
  async getSkills(@Query() query) {
    try {
      return await this.skillsService.searchSkills(query);
    } catch (err) {
      throw new HttpException(`Failed to fetch skills`, 400);
    }
  }
  @Get(':id')
  async getSkill(@Param('id', ParseIntPipe) id: number) {
    return await this.skillsService.getSkill(id);
  }
  @Patch(':id')
  async updateSkill(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateSkillDto,
  ) {
    try {
      const { name, catId, description } = input;
      let category;
      const skill = await this.skillsService.getSkill(id);
      if (!skill)
        throw new HttpException(`Failed to fetch skill with id ${id}`, 404);
      if (!name && !catId && !description) return skill;
      if (catId) {
        category = await this.categoryRepository.findOne(catId);
        if (!category)
          throw new HttpException(
            `Failed to fetch category with ${catId}`,
            404,
          );
        skill.category = category;
      }
      if (name) skill.name = name;
      if (description) skill.description = description;
      await this.repository.save(skill);
      return skill;
    } catch (err) {
      throw new HttpException(
        err.response ? err.response : `Failed to update skill`,
        400,
      );
    }
  }
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id) {
    try {
      const result = await this.skillsService.deleteSkill(id);
      if (result?.affected !== 1)
        throw new HttpException(`Skill with id ${id} not found!`, 404);
      else return true;
    } catch (err) {
      throw new HttpException(`Failed to delete skill with id ${id}`, 404);
    }
  }
}
