import { IsBoolean, IsInt } from 'class-validator';

export class ApplyDto {
  @IsInt()
  offerId: number;
}

export class RemoveDto {
  @IsInt()
  offerId: number;
  @IsInt()
  userId: number;
}

export class AnswerApplicationDto extends ApplyDto {
  @IsBoolean()
  accepted: boolean;
  @IsInt()
  userId: number;
}
