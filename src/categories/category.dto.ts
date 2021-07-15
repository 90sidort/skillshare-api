import { IsString, Length } from 'class-validator';

export class CreateCategoryDto {
  @IsString({ message: 'Name should be a string!' })
  @Length(3, 400, {
    message: 'Name needs at least 3 characters, up to 400 characters!',
  })
  name: string;
}
