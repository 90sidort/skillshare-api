import {
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
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Offer } from './../offer/offer.entity';
import { User } from './../user/user.entity';
import { CreateOfferDto, UpdateCreateDto } from './offer.dto';
import { Skill } from './../skills/skill.entity';
import { OfferService } from './offer.service';
import { AuthGuardJwt } from './../user/authentication/guard';
import { CurrentUser } from './../user/authentication/currentUser.decorator';
import { Role } from './../user/authorization/role.enum';

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

  @UseGuards(AuthGuardJwt)
  @Post()
  async createOffer(@Body() input: CreateOfferDto) {
    try {
      const { title, description, ownerId, skillId } = input;
      const skill = await this.skillRepository.findOne(skillId);
      if (!skill)
        throw new HttpException(`Failed to fetch skill of id: ${skillId}`, 404);
      const user = await this.userRepository.findOne(ownerId);
      if (!user)
        throw new HttpException(`Failed to fetch user of id: ${ownerId}`, 404);
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

  @UseGuards(AuthGuardJwt)
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

  @UseGuards(AuthGuardJwt)
  @Get(':id')
  async getOffer(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.offersService.getSingleOffer(id);
    } catch (err) {
      throw new HttpException(`Failed to fetch offer with id: ${id}`, 400);
    }
  }

  @UseGuards(AuthGuardJwt)
  @Patch(':id')
  async updateOffer(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateCreateDto,
    @CurrentUser() user: User,
  ) {
    try {
      const { title, description, skillId, available } = input;
      let skill = undefined;
      const offer = await this.repository.findOne(id);
      if (offer.ownerId !== user.id && !user.roles.includes(Role.Admin))
        throw new HttpException(
          `Unauthorized to change offer with id ${id}`,
          403,
        );
      if (!title && !description && !skillId && available === undefined)
        return offer;
      if (!offer)
        throw new HttpException(`Failed to fetch offer with id ${id}`, 404);
      if (skillId) skill = this.skillRepository.findOne(skillId);
      if (skillId && skill === undefined)
        throw new HttpException(
          `Failed to fetch skill with id ${skillId}`,
          404,
        );
      if (skillId && skill) offer.skill = skill;
      if (title) offer.title = title;
      if (description) offer.description = description;
      if (available !== undefined) offer.available = available;
      await this.repository.save(offer);
      return offer;
    } catch (err) {
      throw new HttpException(
        err.response.message || `Failed to update offer with id: ${id}`,
        400,
      );
    }
  }

  @UseGuards(AuthGuardJwt)
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id, @CurrentUser() user: User) {
    try {
      const offer = await this.repository.findOne(id, {
        relations: ['applicants', 'participants'],
      });
      if (offer.ownerId !== user.id && !user.roles.includes(Role.Admin))
        throw new HttpException(
          `Unauthorized to delete offer with id ${id}`,
          403,
        );
      if (!offer)
        throw new HttpException(`Offer with id ${id} not found!`, 404);
      if (offer.applicants.length > 0 || offer.participants.length > 0)
        throw new HttpException(`Offer with id ${id} has active members!`, 404);
      const result = await this.offersService.deleteOffer(id);
      if (result?.affected !== 1)
        throw new HttpException(`Offer with id ${id} not found!`, 404);
      else return true;
    } catch (err) {
      throw new HttpException(
        err.response.message || `Failed to delete offer with id ${id}`,
        404,
      );
    }
  }
}
