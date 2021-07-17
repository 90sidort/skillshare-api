import { PartialType } from '@nestjs/mapped-types';
import { Length } from 'class-validator';

export class CreateOfferDto {
  @Length(3, 300, {
    message: 'Title cannot be shorter than 3 characters and longer than 300!',
  })
  title: string;
  @Length(3, 300, {
    message:
      'Description cannot be shorter than 3 characters and longer than 300!',
  })
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
