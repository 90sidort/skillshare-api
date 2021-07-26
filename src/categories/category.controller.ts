import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Category } from './category.entity';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './category.dto';
import { AuthGuardJwt } from './../user/authentication/guard';
import { AdminGuard } from './../user/authorization/roles.guard';

@Controller('/category')
export class CategoryController {
  constructor(
    @InjectRepository(Category)
    private readonly repository: Repository<Category>,
    private readonly categoryService: CategoryService,
  ) {}

  @UseGuards(AuthGuardJwt, AdminGuard)
  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  async addCategory(@Body() input: CreateCategoryDto) {
    try {
      console.log(input);
      const category = new Category();
      category.name = input.name;
      await this.repository.save(category);
      return category;
    } catch (err) {
      console.log(err);
      throw new HttpException(err.message || 'Failed to create category', 400);
    }
  }

  @UseGuards(AuthGuardJwt)
  @Get()
  @UseInterceptors(ClassSerializerInterceptor)
  async getCategories() {
    try {
      return await this.categoryService.getCategoriesWithCountOfSkills();
    } catch (err) {
      throw new HttpException('Failed to get categories', 404);
    }
  }

  @UseGuards(AuthGuardJwt)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get(':id')
  async getCategory(@Param('id', ParseIntPipe) id: number) {
    try {
      const category = await this.categoryService.getCategory(id);
      if (!category)
        throw new HttpException(`Failed to get category of id: ${id}`, 404);
      return category;
    } catch (err) {
      throw new HttpException(
        err.message || `Failed to get category of id: ${id}`,
        404,
      );
    }
  }

  @UseGuards(AuthGuardJwt, AdminGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Patch(':id')
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: CreateCategoryDto,
  ) {
    try {
      const updateQuery = await this.categoryService.updateCategory(id, input);
      if (updateQuery.affected === 0)
        throw new HttpException(`Failed to find category of id ${id}`, 404);
      return true;
    } catch (err) {
      throw new HttpException(
        err.response || `Failed to update category of id: ${id}`,
        404,
      );
    }
  }

  @UseGuards(AuthGuardJwt, AdminGuard)
  @Delete(':id')
  @HttpCode(204)
  @UseInterceptors(ClassSerializerInterceptor)
  async remove(@Param('id') id) {
    try {
      const result = await this.categoryService.deleteCategory(id);
      if (result?.affected !== 1)
        throw new HttpException(`Category with id ${id} not found!`, 404);
      else return true;
    } catch (err) {
      throw new HttpException(
        err.response || `Failed to delete category of id: ${id}`,
        404,
      );
    }
  }
}
