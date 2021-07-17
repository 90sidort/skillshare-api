import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OfferStatusEnum } from 'src/offer/offer.entity';
import { paginate, PaginateOptions } from 'src/pagination/paginator';
import { DeleteResult, Repository } from 'typeorm';
import { skillSearchQuery } from './skill.dto';
import { Skill } from './skill.entity';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
  ) {}
  private getSkillsBaseQuery() {
    return this.skillsRepository
      .createQueryBuilder('s')
      .orderBy('s.id', 'DESC');
  }
  public getSkillsWithCountOfOffers() {
    return this.getSkillsBaseQuery()
      .loadRelationCountAndMap('s.offersCount', 's.offers')
      .loadRelationCountAndMap('s.offersPending', 's.offers', 'offer', (qb) =>
        qb.where('offer.status = :status', {
          status: OfferStatusEnum.Pending,
        }),
      )
      .loadRelationCountAndMap('s.offersAccepted', 's.offers', 'offer', (qb) =>
        qb.where('offer.status = :status', {
          status: OfferStatusEnum.Accepted,
        }),
      );
  }
  public async searchSkills(search: skillSearchQuery) {
    const { categoryId, name } = search;
    const base = this.getSkillsBaseQuery();
    if (categoryId) base.andWhere('s.categoryId = :categoryId', { categoryId });
    if (name) base.andWhere('s.name like :name', { name: `%${name}%` });
    return base;
  }
  public async getFilteredSkillsPaginated(
    paginateOptions: PaginateOptions,
    search: skillSearchQuery,
  ) {
    return await paginate(await this.searchSkills(search), paginateOptions);
  }
  public async getSkill(id: number): Promise<Skill | undefined> {
    const query = this.getSkillsWithCountOfOffers().andWhere('s.id = :id', {
      id,
    });
    return await query.getOne();
  }
  public async deleteSkill(id: number): Promise<DeleteResult> {
    return await this.skillsRepository
      .createQueryBuilder('s')
      .delete()
      .where('id = :id', { id })
      .execute();
  }
}
