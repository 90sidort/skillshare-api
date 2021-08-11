import {
  Controller,
  Get,
  HttpException,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import fs = require('fs');
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CurrentUser } from './authentication/currentUser.decorator';
import { AuthGuardJwt } from './authentication/guard';
import { storageConfig } from './storage';
import { User } from './user.entity';
import { UserService } from './user.service';

const imageRoot = {
  root: './uploads/profileimages',
};

@Controller('image')
export class ImageController {
  constructor(
    private readonly userService: UserService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @UseGuards(AuthGuardJwt)
  @Get()
  async getImage(@CurrentUser() userReq: User, @Res() res) {
    try {
      if (!userReq.imagepath)
        return await res.sendFile(
          'cheems_user2021-08-11T14:04:50.726Z.jpg',
          imageRoot,
        );
      return await res.sendFile(userReq.imagepath, imageRoot);
    } catch (err) {
      throw new HttpException(
        err.response ? err.response : `Failed to send image`,
        err.status ? err.status : 400,
      );
    }
  }

  @UseGuards(AuthGuardJwt)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', storageConfig))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() userReq: User,
  ): Promise<User> {
    try {
      if (!file || file.size > 1000000)
        throw new HttpException(
          `File size is to big, it can be up to 1mb`,
          400,
        );
      const user = await this.userService.getUserById(userReq.id);
      if (!user.imagepath.includes('cheems_user')) {
        const deleteFile = './uploads/profileimages/' + user.imagepath;
        fs.unlinkSync(deleteFile);
      }
      user.imagepath = file.filename;
      await this.userRepository.save(user);
      return user;
    } catch (err) {
      throw new HttpException(
        err.response ? err.response : `Failed to upload image`,
        err.status ? err.status : 400,
      );
    }
  }
}
