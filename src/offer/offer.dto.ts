import { Length } from 'class-validator';
import { User } from 'src/user/user.entity';

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
  skill: number;
  owner: User;
  participants?: User[] = [];
}
