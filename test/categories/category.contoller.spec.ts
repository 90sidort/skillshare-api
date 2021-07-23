import { Repository } from 'typeorm';
import { HttpException } from '@nestjs/common';

import { Category } from '../../src/categories/category.entity';
import { CategoryController } from '../../src/categories/category.controller';
import { CategoryService } from '../../src/categories/category.service';
import { data } from './category.mocks';

describe('Categories controller', () => {
  let categoryController: CategoryController;
  let categoryService: CategoryService;
  let categoryRepository: Repository<Category>;
  beforeAll(() => {});
  beforeEach(() => {
    categoryService = new CategoryService(categoryRepository);
    categoryController = new CategoryController(
      categoryRepository,
      categoryService,
    );
  });
  test('Should return list of categories', async () => {
    categoryService.getCategoriesWithCountOfSkills = jest
      .fn()
      .mockImplementation((): any => data);
    expect(await categoryController.getCategories()).toEqual(data);
  });
  test('Should throw an error when category to be deleted does not exist', async () => {
    categoryService.deleteCategory = jest.fn().mockImplementation(() => null);
    try {
      await categoryController.remove(1);
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
    }
  });
});
