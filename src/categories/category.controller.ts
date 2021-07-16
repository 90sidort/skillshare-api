import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  SerializeOptions,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Category } from './category.entity';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './category.dto';

@Controller('/category')
@SerializeOptions({ strategy: 'excludeAll' })
export class CategoryController {
  constructor(
    @InjectRepository(Category)
    private readonly repository: Repository<Category>,
    private readonly categoryService: CategoryService,
  ) {}

  @Post()
  async addCategory(@Body() input: CreateCategoryDto) {
    try {
      const category = new Category();
      category.name = input.name;
      await this.repository.save(category);
      return category;
    } catch (err) {
      throw new HttpException('Failed to create category', 400);
    }
  }
  @Get()
  async getCategories() {
    try {
      return await this.categoryService.getCategoriesWithCountOfSkills();
    } catch (err) {
      throw new HttpException('Failed to get categories', 404);
    }
  }
  @Get(':id')
  async getCategory(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.categoryService.getCategory(id);
    } catch (err) {
      throw new HttpException(`Failed to get category of id: ${id}`, 404);
    }
  }
  @Patch(':id')
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: CreateCategoryDto,
  ) {
    try {
      const category = await this.repository.findOne(id);
      if (!category)
        throw new HttpException(`Failed to find category of id ${id}`, 403);
      category.name = input.name;
      await this.repository.save(category);
      return category;
    } catch (err) {
      throw new HttpException(`Failed to update category of id: ${id}`, 404);
    }
  }
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id) {
    try {
      const result = await this.categoryService.deleteCategory(id);
      if (result?.affected !== 1)
        throw new HttpException(`Category with id ${id} not found!`, 404);
      else return true;
    } catch (err) {
      throw new HttpException(
        err ? err.response : `Failed to delete category of id: ${id}`,
        404,
      );
    }
  }
}
