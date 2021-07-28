import { PartialType } from '@nestjs/mapped-types';
import { Length, IsOptional, IsInt, Max, Min } from 'class-validator';
import { ReviewStatusEnum } from './review.entity';

export class reviewSearchQuery {
  title?: string;
  rating?: number;
  authorId?: number;
  reviewedId?: number;
}

export class createReviewDto {
  @Length(3, 400, {
    message: 'Title cannot be shorter than 3 characters and longer than 400!',
  })
  title: string;
  @IsOptional()
  @Length(3, 3000, {
    message: 'Review cannot be shorter than 3 characters and longer than 3000!',
  })
  review?: string;
  @IsInt({ message: 'Rating must be a number' })
  @Min(1, { message: 'Rating cannot be less than 1' })
  @Max(10, { message: 'Rating cannot be greater than 10' })
  rating: number;
  @IsInt({ message: 'Reviewd id must be a number' })
  reviewedId: number;
}

export class updateReviewDto extends PartialType(createReviewDto) {
  status?: ReviewStatusEnum;
}
