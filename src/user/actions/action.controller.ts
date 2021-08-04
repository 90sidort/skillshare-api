import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpException,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Offer } from './../../offer/offer.entity';
import { User } from './../../user/user.entity';
import { OfferService } from './../../offer/offer.service';
import { AnswerApplicationDto, ApplyDto, RemoveDto } from './action.dto';
import { AuthGuardJwt } from '../authentication/guard';
import { CurrentUser } from '../authentication/currentUser.decorator';
import { Role } from '../authorization/role.enum';

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
      const userOffers = [];
      user.applied.forEach((application) => userOffers.push(application.id));
      user.participates.forEach((participation) =>
        userOffers.push(participation.id),
      );
      if (userOffers.includes(offerId))
        throw new HttpException(
          `You have already applied for offer of id ${offerId}`,
          400,
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
        err.status ? err.status : 500,
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
      throw new HttpException(
        err.response
          ? err.response
          : `Failed to deapply for offer of id: ${offerId}`,
        err.status ? err.status : 500,
      );
    }
  }

  @UseGuards(AuthGuardJwt)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get('/applicants/:id')
  async getApplications(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() userReq: User,
  ) {
    try {
      if (id !== userReq.id && !userReq.roles.includes(Role.Admin))
        throw new HttpException(
          `User with id: ${userReq.id} is unauthorized!`,
          403,
        );
      const applicants = await this.offersService.getApplicantsByOwner(id);
      if (applicants.length === 0)
        throw new HttpException(`User with id: ${id} does not exist!`, 404);
      return applicants;
    } catch (err) {
      throw new HttpException(
        err.response
          ? err.response
          : `Failed to get applicants for user of id: ${id}`,
        err.status ? err.status : 500,
      );
    }
  }

  @UseGuards(AuthGuardJwt)
  @UseInterceptors(ClassSerializerInterceptor)
  @Patch('/answer')
  async answer(
    @Body() input: AnswerApplicationDto,
    @CurrentUser() userReq: User,
  ) {
    const { offerId, userId, accepted } = input;
    try {
      const user = await this.userRepository.findOne(userId, {
        relations: ['applied'],
      });
      if (!user)
        throw new HttpException(`User with id ${userId} not found!`, 404);
      const offer = await this.offerRepository.findOne(offerId, {
        relations: ['participants', 'applicants'],
      });
      if (!offer)
        throw new HttpException(`Offer with id ${offerId} not found!`, 404);
      let appliedIds = [];
      user.applied.forEach((application) => appliedIds.push(application.id));
      if (!appliedIds.includes(offer.id))
        throw new HttpException(
          `User with id: ${userId} did not apply for offer of id: ${offer.id}!`,
          400,
        );
      if (offer.ownerId !== userReq.id)
        throw new HttpException(
          `User with id: ${userReq.id} is unauthorized!`,
          403,
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
        (applicant) => applicant.id !== user.id,
      );
      await this.offerRepository.save(offer);
      return offer;
    } catch (err) {
      throw new HttpException(
        err.response ? err.response : `Failed to accept application`,
        err.status ? err.status : 500,
      );
    }
  }

  @UseGuards(AuthGuardJwt)
  @UseInterceptors(ClassSerializerInterceptor)
  @Patch('/remove')
  async remove(@Body() input: RemoveDto, @CurrentUser() userReq: User) {
    const { offerId, userId } = input;
    try {
      const user = await this.userRepository.findOne(userId, {
        relations: ['participates'],
      });
      if (!user)
        throw new HttpException(`User with id ${userId} not found!`, 404);
      const offer = await this.offerRepository.findOne(offerId, {
        relations: ['participants'],
      });
      if (!offer)
        throw new HttpException(`Offer with id ${offerId} not found!`, 404);
      if (offer.ownerId !== userReq.id && !userReq.roles.includes(Role.Admin))
        throw new HttpException(
          `User with id: ${userReq.id} is unauthorized!`,
          403,
        );
      offer.participants = offer.participants.filter(
        (participant) => participant.id !== userId,
      );
      await this.offerRepository.save(offer);
      return offer;
    } catch (err) {
      throw new HttpException(
        err.response ? err.response : `Failed to remove from offer`,
        err.status ? err.status : 500,
      );
    }
  }
}
