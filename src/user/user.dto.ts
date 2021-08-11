import { PartialType } from '@nestjs/mapped-types';
import { IsEmail, Length, IsOptional } from 'class-validator';

export class userSearchQuery {
  username?: string;
  email?: string;
}

export class userSignin {
  username: string;
  password: string;
}

export class SignupDto {
  @Length(3, 300, {
    message:
      'User name cannot be shorter than 3 characters and longer than 300!',
  })
  username: string;
  @Length(3, 300, {
    message: 'Name cannot be shorter than 3 characters and longer than 300!',
  })
  name: string;
  @Length(3, 300, {
    message: 'Surname cannot be shorter than 3 characters and longer than 300!',
  })
  surname: string;
  @Length(3, 300, {
    message:
      'Password cannot be shorter than 3 characters and longer than 300!',
  })
  password: string;
  @Length(3, 300, {
    message:
      'Password cannot be shorter than 3 characters and longer than 100!',
  })
  retype: string;
  @Length(0, 300, {
    message:
      'Imagepath cannot be shorter than 3 characters and longer than 100!',
  })
  imagepath: string;
  @IsEmail()
  email: string;
  @Length(3, 2000, {
    message: 'About cannot be shorter than 3 characters and longer than 2000!',
  })
  about: string;
}

export class UpdateUserDto extends PartialType(SignupDto) {
  @IsOptional()
  @Length(3, 300, {
    message:
      'Password cannot be shorter than 3 characters and longer than 100!',
  })
  newPassword?: string;
  @IsOptional()
  @Length(3, 300, {
    message:
      'Password cannot be shorter than 3 characters and longer than 100!',
  })
  retypeNewPassword?: string;
}
