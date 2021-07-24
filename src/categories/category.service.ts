import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';

import { Category } from './category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}
  private getCategoryBaseQuery() {
    return this.categoryRepository
      .createQueryBuilder('c')
      .orderBy('c.id', 'DESC');
  }
  public getPlainCategories() {
    return this.getCategoryBaseQuery().execute();
  }
  public async getCategoriesWithCountOfSkills() {
    return this.getCategoryBaseQuery()
      .loadRelationCountAndMap('c.skillCount', 'c.skills')
      .getMany();
  }
  public async getCategory(id: number) {
    return await this.categoryRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.skills', 'skill')
      .where('c.id = :id', { id })
      .getOne();
  }
  public async updateCategory(
    id: number,
    input: { name: string },
  ): Promise<UpdateResult> {
    return await this.categoryRepository
      .createQueryBuilder('category')
      .update(Category)
      .set({ name: input.name })
      .where('category.id = :id', { id })
      .execute();
  }
  public async deleteCategory(id: number): Promise<DeleteResult> {
    return await this.categoryRepository
      .createQueryBuilder('c')
      .delete()
      .where('id = :id', { id })
      .execute();
  }
}
