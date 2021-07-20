import { PartialType } from '@nestjs/mapped-types';
import { IsInt, Length, Max, Min } from 'class-validator';

export class CreateOfferDto {
  @Length(3, 300, {
    message: 'Title cannot be shorter than 3 characters and longer than 300!',
  })
  title: string;
  @Length(3, 300, {
    message:
      'Description cannot be shorter than 3 characters and longer than 300!',
  })
  @IsInt({ message: 'Limit must be a number' })
  @Min(1, { message: 'Limit cannot be less than 1' })
  @Max(10, { message: 'Limit cannot be greater than 10' })
  limit?: number;
  description: string;
  skillId: number;
  ownerId: number;
}

export class UpdateCreateDto extends PartialType(CreateOfferDto) {
  available?: boolean;
}

export class offerSearchQuery {
  title?: string;
  skillId?: number;
  ownerId?: number;
}
