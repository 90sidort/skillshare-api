import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SignupDto, UpdateUserDto, userSignin } from './user.dto';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { CurrentUser } from './authentication/currentUser.decorator';
import { AuthGuardJwt } from './authentication/guard';
import { Role } from './authorization/role.enum';

@Controller('users')
export class UsersController {
  constructor(
    private readonly userService: UserService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Post('signin')
  @UseInterceptors(ClassSerializerInterceptor)
  async signin(@Body() input: userSignin) {
    const { username, password } = input;
    try {
      const user = await this.userRepository.findOne({ username });
      if (!user)
        throw new HttpException(
          `User with username: ${username} not found!`,
          404,
        );
      if (!(await this.userService.comparePasswords(user.password, password)))
        throw new HttpException(
          `Provided password does not match accounts password`,
          403,
        );
      return {
        userId: user.id,
        token: this.userService.getTokenForUser(user),
      };
    } catch (err) {
      throw new HttpException(
        err.response ? err.response : `Failed to signin`,
        err.status ? err.status : 400,
      );
    }
  }

  @Post('signup')
  @UseInterceptors(ClassSerializerInterceptor)
  async create(@Body() input: SignupDto) {
    try {
      if (input.password !== input.retype)
        throw new HttpException('Passwords do not match!', 400);
      const exists = await this.userRepository.findOne({
        where: [{ username: input.username }, { email: input.email }],
      });
      if (exists)
        throw new HttpException('Username or email already taken!', 400);
      const user = new User();
      user.username = input.username;
      user.name = input.name;
      user.surname = input.surname;
      user.password = await this.userService.hashPassword(input.password);
      user.email = input.email;
      user.about = input.about;
      await this.userRepository.save(user);

      return {
        ...user,
        password: null,
        createdAt: null,
        updatedAt: null,
        token: this.userService.getTokenForUser(user),
      };
    } catch (err) {
      throw new HttpException(
        err.response ? err.response : `Failed to signup`,
        err.status ? err.status : 400,
      );
    }
  }

  @UseGuards(AuthGuardJwt)
  @Get()
  @UseInterceptors(ClassSerializerInterceptor)
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
      throw new HttpException(
        err.response ? err.response : `Failed to fetch users`,
        err.status ? err.status : 400,
      );
    }
  }

  @UseGuards(AuthGuardJwt)
  @Get(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  async getUser(@Param('id', ParseIntPipe) id: number) {
    try {
      const user = await this.userService.getUserWithCountsAndRelations(id);
      if (!user)
        throw new HttpException(`User with id: ${id} does not exist`, 404);
      return user;
    } catch (err) {
      throw new HttpException(
        err.response ? err.response : `Failed to fetch user`,
        err.status ? err.status : 400,
      );
    }
  }

  @UseGuards(AuthGuardJwt)
  @Patch(':id')
  @UseInterceptors(ClassSerializerInterceptor)
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
      if (user.id !== userReq.id && !userReq.roles.includes(Role.Admin))
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
      if (newPassword) {
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
      if (email) {
        const emailExists = await this.userService.getUserByEmail(email);
        if (emailExists)
          throw new HttpException(
            `Email ${email} is taken. Use another email!`,
            400,
          );
        user.email = email;
      }
      await this.userRepository.save(user);
      return user;
    } catch (err) {
      throw new HttpException(
        err.response ? err.response : `Failed to update user`,
        err.status ? err.status : 400,
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
      if (user.id !== userReq.id && !userReq.roles.includes(Role.Admin))
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
        err.response ? err.response : `Failed to delete User with id ${id}`,
        err.status ? err.status : 400,
      );
    }
  }
}
