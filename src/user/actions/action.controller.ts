import { Body, Controller, Get, HttpException, Patch } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserService } from '../user.service';
import { Offer } from 'src/offer/offer.entity';
import { User } from '../user.entity';
import { OfferService } from 'src/offer/offer.service';
import { AnswerApplicationDto, ApplyDto } from './action.dto';

@Controller('/actions')
export class ActionController {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userService: UserService,
    private readonly offersService: OfferService,
  ) {}
  @Patch('/apply')
  async apply(@Body() input: ApplyDto) {
    const { userId, offerId } = input;
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
  @Patch('/deapply')
  async deapply(@Body() input: ApplyDto) {
    const { userId, offerId } = input;
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
  @Get('/applicants')
  async getApplications(@Body() input: { ownerId: number }) {
    return this.offersService.getApplicantsByOwner(input.ownerId);
  }
  @Patch('/answer')
  async accept(@Body() input: AnswerApplicationDto) {
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
  @Patch('/remove')
  async remove(@Body() input: ApplyDto) {
    const { userId, offerId } = input;
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
