import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpException,
  Patch,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Offer } from './../../offer/offer.entity';
import { User } from './../../user/user.entity';
import { OfferService } from './../../offer/offer.service';
import { AnswerApplicationDto, ApplyDto } from './action.dto';
import { AuthGuardJwt } from '../authentication/guard';
import { CurrentUser } from '../authentication/currentUser.decorator';

@Controller('/actions')
export class ActionController {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly offersService: OfferService,
  ) {}

  @UseGuards(AuthGuardJwt)
  @UseInterceptors(ClassSerializerInterceptor)
  @Patch('/apply')
  async apply(@Body() input: ApplyDto, @CurrentUser() userReq: User) {
    const { offerId } = input;
    try {
      const user = await this.userRepository.findOne(userReq.id, {
        relations: ['applied', 'participates'],
      });
      if (!user)
        throw new HttpException(`User with id ${userReq.id} not found!`, 404);
      if (user.applied.length + user.participates.length >= 10)
        throw new HttpException(
          `User with id ${userReq.id} has already reached skill share limit of 10!`,
          404,
        );
      const offer = await this.offerRepository.findOne(offerId, {
        relations: ['participants', 'applicants'],
      });
      if (!offer)
        throw new HttpException(`Offer with id ${offerId} not found!`, 404);
      if (offer.ownerId === userReq.id)
        throw new HttpException(`Can't apply for your own offer`, 400);
      if (offer.participants.length + 1 < offer.limit) {
        offer.applicants.push(user);
        await this.offerRepository.save(offer);
      } else {
        throw new HttpException(
          `Offer with id ${offerId} has already reached skill share limit of ${offer.limit}!`,
          404,
        );
      }
      return offer;
    } catch (err) {
      throw new HttpException(
        err.response
          ? err.response
          : `Failed to apply for offer of id: ${offerId}`,
        err.status ? err.status : 404,
      );
    }
  }

  @UseGuards(AuthGuardJwt)
  @Patch('/deapply')
  async deapply(@Body() input: ApplyDto, @CurrentUser() userReq: User) {
    const { offerId } = input;
    try {
      const user = await this.userRepository.findOne(userReq.id, {
        relations: ['applied', 'participates'],
      });
      if (!user)
        throw new HttpException(`User with id ${userReq.id} not found!`, 404);
      const offer = await this.offerRepository.findOne(offerId, {
        relations: ['participants', 'applicants'],
      });
      if (!offer)
        throw new HttpException(`Offer with id ${offerId} not found!`, 404);
      offer.applicants = offer.applicants.filter(
        (applicant) => applicant.id !== userReq.id,
      );
      await this.offerRepository.save(offer);
      return offer;
    } catch (err) {
      throw new HttpException(`Failed to apply for offer`, 403);
    }
  }
  @UseGuards(AuthGuardJwt)
  @Get('/applicants')
  async getApplications(
    @Body() input: { ownerId: number },
    @CurrentUser() userReq: User,
  ) {
    if (input.ownerId !== userReq.id)
      throw new HttpException(
        `User with id: ${userReq.id} is unauthorized!`,
        404,
      );
    return this.offersService.getApplicantsByOwner(input.ownerId);
  }

  @UseGuards(AuthGuardJwt)
  @Patch('/answer')
  async accept(
    @Body() input: AnswerApplicationDto,
    @CurrentUser() userReq: User,
  ) {
    const { offerId, accepted } = input;
    try {
      const user = await this.userRepository.findOne(userReq.id, {
        relations: ['applied', 'participates'],
      });
      if (!user)
        throw new HttpException(`User with id ${userReq.id} not found!`, 404);
      const offer = await this.offerRepository.findOne(offerId, {
        relations: ['participants', 'applicants'],
      });
      if (!offer)
        throw new HttpException(`Offer with id ${offerId} not found!`, 404);
      if (offer.ownerId !== userReq.id)
        throw new HttpException(
          `User with id: ${userReq.id} is unauthorized!`,
          404,
        );
      if (!offer.available)
        throw new HttpException(
          `Offer with id ${offerId} no longer available!`,
          400,
        );
      if (accepted) {
        if (offer.participants.length >= offer.limit)
          throw new HttpException(
            `Offer of id ${offerId} has already reached max limit of ${offer.limit}!`,
            400,
          );
        offer.participants.push(user);
      }
      offer.applicants = offer.applicants.filter(
        (applicant) => applicant.id !== userReq.id,
      );
      await this.offerRepository.save(offer);
      return offer;
    } catch (err) {
      throw new HttpException(`Failed to accept offer`, 403);
    }
  }

  @UseGuards(AuthGuardJwt)
  @Patch('/remove')
  async remove(@Body() input: ApplyDto, @CurrentUser() userReq: User) {
    const { offerId } = input;
    try {
      const user = await this.userRepository.findOne(userReq.id, {
        relations: ['participates'],
      });
      if (!user)
        throw new HttpException(`User with id ${userReq.id} not found!`, 404);
      if (user.id !== userReq.id)
        throw new HttpException(
          `User with id: ${userReq.id} is unauthorized!`,
          404,
        );
      const offer = await this.offerRepository.findOne(offerId, {
        relations: ['participants'],
      });
      if (!offer)
        throw new HttpException(`Offer with id ${offerId} not found!`, 404);
      offer.participants = offer.participants.filter(
        (participant) => participant.id !== userReq.id,
      );
      await this.offerRepository.save(offer);
      return offer;
    } catch (err) {
      throw new HttpException(`Failed to remove from offer`, 403);
    }
  }
}
