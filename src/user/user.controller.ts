import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SignupDto, UpdateUserDto } from './user.dto';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { CurrentUser } from './authentication/currentUser.decorator';
import { AuthGuardJwt, AuthGuardLocal } from './authentication/guard';
import { Role } from './authorization/role.enum';

@Controller('users')
@SerializeOptions({ strategy: 'excludeAll' })
export class UsersController {
  constructor(
    private readonly userService: UserService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @UseGuards(AuthGuardLocal)
  @Post('signin')
  async signin(@CurrentUser() user: User) {
    return {
      userId: user.id,
      token: this.userService.getTokenForUser(user),
    };
  }

  @Post('signup')
  async create(@Body() input: SignupDto) {
    try {
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
    } catch (err) {
      throw new HttpException(err.response.message || `Failed to signup`, 400);
    }
  }

  @UseGuards(AuthGuardJwt)
  @Get()
  async getUsers(@Query() query) {
    const { limit = 10, currentPage = 1, username, email } = query;
    const search = { username, email };
    const paginator = { limit, total: true, currentPage };
    try {
      return await this.userService.getFilteredUsersPaginated(
        paginator,
        search,
      );
    } catch (err) {
      throw new HttpException(`Failed to fetch users`, 400);
    }
  }

  @UseGuards(AuthGuardJwt)
  @Get(':id')
  async getUser(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.userService.getUserWithCountsAndRelations(id);
    } catch (err) {
      throw new HttpException(`Failed to fetch user`, 400);
    }
  }

  @UseGuards(AuthGuardJwt)
  @Patch(':id')
  async updateSkill(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateUserDto,
    @CurrentUser() userReq: User,
  ) {
    const {
      name,
      surname,
      about,
      password,
      newPassword,
      retypeNewPassword,
      email,
    } = input;
    try {
      const user = await this.userService.getUserById(id);
      if (!user)
        throw new HttpException(`Failed to fetch user with id ${id}`, 404);
      if (user.id !== userReq.id && !user.roles.includes(Role.Admin))
        throw new HttpException(
          `Unauthorized to update user with id ${id}`,
          403,
        );
      if (
        !name &&
        !surname &&
        !about &&
        !password &&
        !newPassword &&
        !retypeNewPassword &&
        !email
      )
        return user;
      if (name) user.name = name;
      if (surname) user.surname = surname;
      if (about) user.about = about;
      if (newPassword && retypeNewPassword) {
        if (!password)
          throw new HttpException(
            `Cannot update password without providing old one`,
            403,
          );
        if (!(await this.userService.comparePasswords(user.password, password)))
          throw new HttpException(
            `Provided password does not match accounts password`,
            403,
          );
        if (newPassword !== retypeNewPassword)
          throw new HttpException(`Passwords do not match`, 403);
        user.password = await this.userService.hashPassword(newPassword);
      }
      if (email) user.email = email;
      await this.userRepository.save(user);
      return user;
    } catch (err) {
      throw new HttpException(
        err.response.message || `Failed to update user`,
        400,
      );
    }
  }

  @UseGuards(AuthGuardJwt)
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id, @CurrentUser() userReq: User) {
    try {
      const user = await this.userRepository.findOne(id, {
        relations: ['participates', 'applied', 'offers'],
      });
      if (!user) throw new HttpException(`User with id ${id} not found!`, 404);
      if (user.id !== userReq.id && !user.roles.includes(Role.Admin))
        throw new HttpException(
          `Unauthorized to delete user with id ${id}`,
          403,
        );
      if (
        user.participates.length > 0 ||
        user.applied.length > 0 ||
        user.offers.length > 0
      )
        throw new HttpException(`User with id ${id} has active offers!`, 404);
      const result = await this.userService.deleteUser(id);
      if (result?.affected !== 1)
        throw new HttpException(`User with id ${id} not found!`, 404);
      else return true;
    } catch (err) {
      throw new HttpException(
        err.response.message || `Failed to delete User with id ${id}`,
        404,
      );
    }
  }
}
