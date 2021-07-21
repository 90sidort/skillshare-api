import {
  Body,
  Controller,
  Get,
  HttpException,
  Patch,
  UseGuards,
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
  @Patch('/apply')
  async apply(@Body() input: ApplyDto, @CurrentUser() userReq: User) {
    const { userId, offerId } = input;
    if (userId !== userReq.id)
      throw new HttpException(
        `User with id: ${userReq.id} is unauthorized!`,
        404,
      );
    try {
      const user = await this.userRepository.findOne(userId, {
        relations: ['applied', 'participates'],
      });
      if (!user)
        throw new HttpException(`User with id ${userId} not found!`, 404);
      if (user.applied.length + user.participates.length >= 10)
        throw new HttpException(
          `User with id ${userId} has already reached skill share limit of 10!`,
          404,
        );
      const offer = await this.offerRepository.findOne(offerId, {
        relations: ['participants', 'applicants'],
      });
      if (!offer)
        throw new HttpException(`Offer with id ${offerId} not found!`, 404);
      if (offer.participants.length < offer.limit) {
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
      throw new HttpException(`Failed to apply for offer`, 403);
    }
  }

  @UseGuards(AuthGuardJwt)
  @Patch('/deapply')
  async deapply(@Body() input: ApplyDto, @CurrentUser() userReq: User) {
    const { userId, offerId } = input;
    if (userId !== userReq.id)
      throw new HttpException(
        `User with id: ${userReq.id} is unauthorized!`,
        404,
      );
    try {
      const user = await this.userRepository.findOne(userId, {
        relations: ['applied', 'participates'],
      });
      if (!user)
        throw new HttpException(`User with id ${userId} not found!`, 404);
      const offer = await this.offerRepository.findOne(offerId, {
        relations: ['participants', 'applicants'],
      });
      if (!offer)
        throw new HttpException(`Offer with id ${offerId} not found!`, 404);
      offer.applicants = offer.applicants.filter(
        (applicant) => applicant.id !== userId,
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
    const { userId, offerId, accepted } = input;
    try {
      const user = await this.userRepository.findOne(userId, {
        relations: ['applied', 'participates'],
      });
      if (!user)
        throw new HttpException(`User with id ${userId} not found!`, 404);
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
        (applicant) => applicant.id !== userId,
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
    const { userId, offerId } = input;
    try {
      const user = await this.userRepository.findOne(userId, {
        relations: ['participates'],
      });
      if (!user)
        throw new HttpException(`User with id ${userId} not found!`, 404);
      if (userId !== userReq.id && user.id !== userReq.id)
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
        (participant) => participant.id !== userId,
      );
      await this.offerRepository.save(offer);
      return offer;
    } catch (err) {
      throw new HttpException(`Failed to remove from offer`, 403);
    }
  }
}
