import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpException,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Offer } from 'src/offer/offer.entity';
import { User } from 'src/user/user.entity';
import { CreateOfferDto } from './offer.dto';
import { CurrentUser } from 'src/auth/currentUser.decorator';
import { Skill } from 'src/skills/skill.entity';
// import { AuthGuard } from '@nestjs/passport';
import { AuthGuardJwt } from 'src/auth/authguard.jwt';
import { OfferService } from './offer.service';

@Controller('/offer')
export class OfferController {
  constructor(
    @InjectRepository(Offer)
    private readonly repository: Repository<Offer>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
    private readonly offersService: OfferService,
  ) {}
  @Post()
  async createOffer(@Body() input: CreateOfferDto) {
    try {
      const { title, description, ownerId, skillId } = input;
      const skill = await this.skillRepository.findOne(skillId);
      if (!skill) throw new BadRequestException(['This skill does not exist']);
      const user = await this.userRepository.findOne(ownerId);
      if (!user) throw new BadRequestException(['This user does not exist']);
      const offer = new Offer();
      offer.title = title;
      offer.description = description;
      offer.owner = user;
      offer.skill = skill;
      await this.repository.save(offer);
      return offer;
    } catch (err) {
      throw new HttpException(`Failed to create offer`, 400);
    }
  }
  @Get()
  async getOffers(@Query() query) {
    const { limit = 10, currentPage = 1, title, skillId, ownerId } = query;
    try {
      const search = { title, skillId, ownerId };
      const paginator = { limit, total: true, currentPage };
      return await this.offersService.getFilteredOffersPaginated(
        paginator,
        search,
      );
    } catch (err) {
      console.log(err);
      throw new HttpException(`Failed to fetch offers`, 400);
    }
  }
  @Get(':id')
  async getOffer(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.offersService.getSingleOffer(id);
    } catch (err) {
      console.log(err);
      throw new HttpException(`Failed to fetch offer`, 400);
    }
  }

  // @Delete(':id')
  // @HttpCode(204)
  // async deleteOffer(@Param('id', ParseIntPipe) id, @CurrentUser() user: User) {
  //   const offer = await this.repository.findOne(id);
  //   if (!offer)
  //     throw new NotFoundException(null, `Offer with id ${id} not found.`);
  //   if (user.id !== offer.ownerId)
  //     throw new ForbiddenException(
  //       null,
  //       `You cannot delete offer that is not yours!`,
  //     );
  //   await this.repository.remove(offer);
  //   return true;
  // }

  // @Post('/subscribe')
  // async subscribe(@Body() input) {
  //   const offer = await this.repository.findOne(input.oid, {
  //     relations: ['participants'],
  //   });
  //   const user = await this.userRepository.findOne(input.uid, {
  //     relations: ['participates'],
  //   });
  //   user.participates.push(offer);
  //   await this.userRepository.save(user);
  //   return offer;
  // }
  // @Post('/unsubscribe')
  // async unsubscribe(@Body() input) {
  //   const user = await this.userRepository.findOne(input.uid, {
  //     relations: ['participates'],
  //   });
  //   user.participates = user.participates.filter(
  //     (offer) => offer.id !== input.oid,
  //   );
  //   await this.userRepository.save(user);
  //   return user;
  //   // await this.userRepository
  //   //   .createQueryBuilder('u')
  //   //   .update()
  //   //   .set({ about: 'testujemy' })
  //   //   .execute();
  // }
}
