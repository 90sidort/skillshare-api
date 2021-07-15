import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthService } from 'src/auth/auth.service';
import { SignupDto } from 'src/auth/user.dto';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Controller('users')
@SerializeOptions({ strategy: 'excludeAll' })
export class UsersController {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Post()
  // @UseInterceptors(ClassSerializerInterceptor)
  async create(@Body() input: SignupDto) {
    if (input.password !== input.retype)
      throw new BadRequestException(['Passwords does not match!']);
    const exists = await this.userRepository.findOne({
      where: [{ username: input.username }, { email: input.email }],
    });
    if (exists)
      throw new BadRequestException(['Username or email already taken!']);
    const user = new User();
    user.username = input.username;
    user.name = input.name;
    user.surname = input.surname;
    user.password = await this.authService.hashPassword(input.password);
    user.email = input.email;
    user.about = input.about;

    return {
      ...(await this.userRepository.save(user)),
      token: this.authService.getTokenForUser(user),
    };
  }
}
