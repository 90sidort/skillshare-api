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
import { CreateSkillDto, UpdateSkillDto } from './skill.dto';
import { Skill } from './skill.entity';
// import { SkillsService } from './skills.service';
import { Category } from 'src/categories/category.entity';
import { HttpException } from '@nestjs/common';

@Controller('/skills')
export class SkillsController {
  constructor(
    @InjectRepository(Skill)
    private readonly repository: Repository<Skill>,
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>, // private readonly skillsService: SkillsService,
  ) {}

  @Post()
  async addSkill(@Body() input) {
    try {
      const category = await this.categoryRepository.findOne(input.catid);
      const skill = new Skill();
      skill.name = input.name;
      skill.category = category;
      skill.description = input.description;
      await this.repository.save(skill);
      return skill;
    } catch (err) {
      throw new HttpException(`Failed to create skill`, 400);
    }
  }
  @Get(':id')
  async getSkill(@Param('id', ParseIntPipe) id: number) {
    return await this.repository.findOne(id, { relations: ['category'] });
  }
  //   async addOffer(@Param('id', ParseIntPipe) id: number, @Body() input) {
  //     console.log(input);
  //     const skill = await this.repository.findOne(id);
  //     const offer = new Offer();
  //     offer.skill = skill;
  //     offer.title = input.title;
  //     offer.description = input.description;
  //     await this.offerRepository.save(offer);
  //     return skill;
  //   }
  //   @Get()
  //   async findAll(@Query('page') page: number) {
  //     const skills = await this.skillsService.getSkillsWithCountOfOffersPaginated(
  //       { total: true, currentPage: page, limit: 10 },
  //     );
  //     return skills;
  //   }
  //   @Get(':id')
  //   async findOne(@Param('id', ParseIntPipe) id: number) {
  //     return await this.skillsService.getSkill(id);
  //   }
  //   @Post()
  //   async create(@Body(ValidationPipe) input: CreateSkillDto) {
  //     return await this.repository.save({ ...input });
  //   }
  //   @Patch(':id')
  //   async update(@Param('id') id, @Body('input') input: UpdateSkillDto) {
  //     const skill = await this.repository.findOne(id);
  //     return await this.repository.save({
  //       ...skill,
  //       ...input,
  //     });
  //   }
  //   @Delete(':id')
  //   @HttpCode(204)
  //   async remove(@Param('id') id) {
  //     const result = await this.skillsService.deleteSkill(id);
  //     if (result?.affected !== 1) throw new NotFoundException();
  //     else return true;
  //   }
}
