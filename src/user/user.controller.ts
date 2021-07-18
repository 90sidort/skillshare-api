import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  SerializeOptions,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SignupDto } from './user.dto';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';

@Controller('users')
@SerializeOptions({ strategy: 'excludeAll' })
export class UsersController {
  constructor(
    private readonly userService: UserService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Post()
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
    user.password = await this.userService.hashPassword(input.password);
    user.email = input.email;
    user.about = input.about;

    return {
      ...(await this.userRepository.save(user)),
      token: this.userService.getTokenForUser(user),
    };
  }

  @Get(':id')
  async getUsers(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.getUserWithCountsAndRelations(id);
  }
}
