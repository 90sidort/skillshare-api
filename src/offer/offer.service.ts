import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Offer, OfferStatusEnum } from 'src/offer/offer.entity';
import { paginate, PaginateOptions } from 'src/pagination/paginator';
import { DeleteResult, Repository } from 'typeorm';
import { offerSearchQuery } from './offer.dto';

@Injectable()
export class OfferService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
  ) {}
  private getOffersBaseQuery() {
    return this.offerRepository.createQueryBuilder('o').orderBy('o.id', 'DESC');
  }
  public getOffersWithCountOfParticipantsAndApplicants() {
    return this.getOffersBaseQuery()
      .loadRelationCountAndMap('o.applicantCount', 'o.applicants')
      .loadRelationCountAndMap('o.participantCount', 'o.participants');
  }
  public searchOffers(search: offerSearchQuery) {
    const { title, skillId, ownerId } = search;
    let base = this.getOffersWithCountOfParticipantsAndApplicants();
    if (title)
      base.andWhere('LOWER(o.title) like LOWER(:title)', {
        title: `%${title}%`,
      });
    if (skillId) base.andWhere('o.skillId = :skillId', { skillId });
    if (ownerId) base.andWhere('o.ownerId = :ownerId', { ownerId });
    return base;
  }
  public async getFilteredOffersPaginated(
    paginateOptions: PaginateOptions,
    search: offerSearchQuery,
  ) {
    return await paginate(this.searchOffers(search), paginateOptions);
  }
  public async getSingleOffer(id: number) {
    return await this.getOffersWithCountOfParticipantsAndApplicants()
      .andWhere('o.id = :id', {
        id,
      })
      .leftJoin('o.skill', 'skill')
      .leftJoin('o.owner', 'owner')
      .leftJoin('o.participants', 'participants')
      .leftJoin('o.applicants', 'applicants')
      .select([
        'o',
        'skill.id',
        'skill.name',
        'owner.username',
        'owner.email',
        'owner.id',
        'participants.id',
        'participants.username',
        'applicants.id',
        'applicants.username',
      ])
      .getOne();
  }
  public async deleteOffer(id: number): Promise<DeleteResult> {
    return await this.offerRepository
      .createQueryBuilder('o')
      .delete()
      .where('id = :id', { id })
      .execute();
  }
}
