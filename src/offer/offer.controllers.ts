import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
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

@Controller('/offer')
@SerializeOptions({ strategy: 'excludeAll' })
export class OfferController {
  constructor(
    @InjectRepository(Offer)
    private readonly repository: Repository<Offer>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
  ) {}

  @Get()
  @UseGuards(AuthGuardJwt)
  @UseInterceptors(ClassSerializerInterceptor)
  async getOffers() {
    return await this.repository.find();
  }

  @Post('/create')
  @UseGuards(AuthGuardJwt)
  async createOffer(@Body() input: CreateOfferDto, @CurrentUser() user: User) {
    const skill = await this.skillRepository.findOne(input.skill);
    if (!skill) throw new BadRequestException(['This skill does not exist']);
    const offer = new Offer();
    offer.owner = user;
    offer.description = input.description;
    offer.participants = [];
    offer.skill = skill;
    offer.title = input.title;
    await this.repository.save(offer);
    return offer;
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(AuthGuardJwt)
  async deleteOffer(@Param('id') id, @CurrentUser() user: User) {
    const offer = await this.repository.findOne(id);
    if (!offer)
      throw new NotFoundException(null, `Offer with id ${id} not found.`);
    if (user.id !== offer.ownerId)
      throw new ForbiddenException(
        null,
        `You cannot delete offer that is not yours!`,
      );
    await this.repository.remove(offer);
    return true;
  }

  @Post('/subscribe')
  @UseGuards(AuthGuardJwt)
  async subscribe(@Body() input) {
    const offer = await this.repository.findOne(input.oid, {
      relations: ['participants'],
    });
    const user = await this.userRepository.findOne(input.uid, {
      relations: ['participates'],
    });
    user.participates.push(offer);
    await this.userRepository.save(user);
    return offer;
  }
  @Post('/unsubscribe')
  @UseGuards(AuthGuardJwt)
  async unsubscribe(@Body() input) {
    const user = await this.userRepository.findOne(input.uid, {
      relations: ['participates'],
    });
    user.participates = user.participates.filter(
      (offer) => offer.id !== input.oid,
    );
    await this.userRepository.save(user);
    return user;
    // await this.userRepository
    //   .createQueryBuilder('u')
    //   .update()
    //   .set({ about: 'testujemy' })
    //   .execute();
  }
}
