import { PartialType } from '@nestjs/mapped-types';
import { IsString, Length } from 'class-validator';

export class CreateSkillDto {
  @IsString({ message: 'Name should be a string' })
  @Length(3, 200, {
    message: 'Name needs at least 3 characters, up to 200 characters!',
  })
  name: string;
  @IsString({ message: 'Description should be a string' })
  @Length(1, 400, {
    message: 'Description needs at least 1 character, up to 400 characters!',
  })
  description: string;
  @IsString({ message: 'Category should be a string' })
  @Length(3, 200, {
    message: 'Category needs at least 1 character, up to 400 characters!',
  })
  category: string;
}

export class UpdateSkillDto extends PartialType(CreateSkillDto) {}
