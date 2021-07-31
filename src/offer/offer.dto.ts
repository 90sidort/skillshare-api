import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  Length,
  Max,
  Min,
} from 'class-validator';
import { OfferStatusEnum } from './offer.entity';

export class CreateOfferDto {
  @Length(3, 300, {
    message: 'Title cannot be shorter than 3 characters and longer than 300!',
  })
  title: string;
  @Length(3, 2000, {
    message:
      'Description cannot be shorter than 3 characters and longer than 2000!',
  })
  description: string;
  @IsInt({ message: 'Limit must be a number' })
  @Min(1, { message: 'Limit cannot be less than 1' })
  @Max(10, { message: 'Limit cannot be greater than 10' })
  limit?: number;
  skillId: number;
}

export class UpdateCreateDto extends PartialType(CreateOfferDto) {
  @IsOptional()
  @IsBoolean({ message: 'Available status must be a boolean' })
  available?: boolean;
  @IsOptional()
  status?: OfferStatusEnum;
}

export class offerSearchQuery {
  title?: string;
  skillId?: number;
  ownerId?: number;
}
