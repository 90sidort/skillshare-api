import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';

import { paginate, PaginateOptions } from './../pagination/paginator';
import { reviewSearchQuery } from './review.dto';
import { Review } from './review.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}
  private getReviewsBaseQuery() {
    return this.reviewRepository
      .createQueryBuilder('r')
      .orderBy('r.id', 'DESC');
  }
  private searchReviews(search: reviewSearchQuery) {
    const { title, rating, authorId, reviewedId } = search;
    let base = this.getReviewsBaseQuery();
    if (title)
      base.andWhere('LOWER(r.title) like LOWER(:title)', {
        title: `%${title}%`,
      });
    if (rating)
      base.andWhere('r.rating = :rating', {
        rating,
      });
    if (authorId)
      base.andWhere('r.authorId = :authorId', {
        authorId,
      });
    if (reviewedId)
      base.andWhere('r.reviewedId = :reviewedId', {
        reviewedId,
      });
    return base;
  }
  public async getFilteredReviewsPaginated(
    paginateOptions: PaginateOptions,
    search: reviewSearchQuery,
  ) {
    return await paginate(this.searchReviews(search), paginateOptions);
  }
  public async getReviewById(id: number) {
    return this.getReviewsBaseQuery()
      .where('r.id = :id', {
        id,
      })
      .getOne();
  }
  public async deleteReview(id: number): Promise<DeleteResult> {
    return await this.reviewRepository
      .createQueryBuilder('r')
      .delete()
      .where('id = :id', { id })
      .execute();
  }
}
