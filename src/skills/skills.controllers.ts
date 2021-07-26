import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  HttpException,
  ClassSerializerInterceptor,
  UseInterceptors,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateSkillDto, UpdateSkillDto } from './skill.dto';
import { Skill } from './skill.entity';
import { Category } from './../categories/category.entity';
import { SkillsService } from './skills.service';
import { AuthGuardJwt } from './../user/authentication/guard';
import { AdminGuard } from './../user/authorization/roles.guard';

@Controller('/skills')
export class SkillsController {
  constructor(
    @InjectRepository(Skill)
    private readonly repository: Repository<Skill>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly skillsService: SkillsService,
  ) {}

  @UseGuards(AuthGuardJwt, AdminGuard)
  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  async addSkill(@Body() input: CreateSkillDto) {
    try {
      const { name, catId, description } = input;
      const category = await this.categoryRepository.findOne(catId);
      if (!category)
        throw new NotFoundException(`Failed to fetch category with ${catId}`);
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

  @UseGuards(AuthGuardJwt)
  @Get()
  @UseInterceptors(ClassSerializerInterceptor)
  async getSkills(@Query() query) {
    const { limit = 10, currentPage = 1, name, categoryId } = query;
    const search = { name, categoryId };
    const paginator = { limit, total: true, currentPage };
    try {
      return await this.skillsService.getFilteredSkillsPaginated(
        paginator,
        search,
      );
    } catch (err) {
      throw new HttpException(`Failed to fetch skills`, 400);
    }
  }

  @UseGuards(AuthGuardJwt)
  @Get(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  async getSkill(@Param('id', ParseIntPipe) id: number) {
    try {
      const skill = await this.skillsService.getSkill(id);
      if (skill) return skill;
      else throw new NotFoundException(`Failed to find skill of id ${id}`);
    } catch (err) {
      throw new HttpException(
        err.response ? err.response : `Failed to get skill with ${id}`,
        400,
      );
    }
  }

  @UseGuards(AuthGuardJwt, AdminGuard)
  @Patch(':id')
  @UseInterceptors(ClassSerializerInterceptor)
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

  @UseGuards(AuthGuardJwt, AdminGuard)
  @Delete(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(204)
  async remove(@Param('id') id) {
    try {
      const result = await this.skillsService.deleteSkill(id);
      if (result?.affected !== 1)
        throw new NotFoundException(`Skill with id ${id} not found!`);
      else return true;
    } catch (err) {
      if (err.code === '23503')
        throw new BadRequestException(
          `Cannot delete skill of id ${id} with active offers`,
        );
      throw new HttpException(
        err.response ? err.response : `Failed to delete skill with id ${id}`,
        404,
      );
    }
  }
}
