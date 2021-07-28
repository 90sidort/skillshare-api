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
import { Repository } from 'typeorm';

import { createReviewDto, updateReviewDto } from './review.dto';
import { Review } from './review.entity';
import { User } from './../user/user.entity';
import { ReviewService } from './review.service';
import { CurrentUser } from './../user/authentication/currentUser.decorator';
import { Role } from './../user/authorization/role.enum';
import { AuthGuardJwt } from './../user/authentication/guard';

@Controller('reviews')
export class ReviewController {
  constructor(
    private readonly reviewService: ReviewService,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @UseGuards(AuthGuardJwt)
  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  async createReview(
    @Body() input: createReviewDto,
    @CurrentUser() user: User,
  ) {
    const { title, rating, review, reviewedId } = input;
    try {
      if (user.id === reviewedId)
        throw new BadRequestException('You cannot review yourself!');
      const author = await this.userRepository.findOne(user.id);
      if (!author)
        throw new HttpException(`User with id: ${user.id} not found!`, 404);
      const reviewed = await this.userRepository.findOne(reviewedId);
      if (!reviewed)
        throw new HttpException(`User with id: ${reviewedId} not found!`, 404);
      const newReview = new Review();
      newReview.author = author;
      newReview.reviewed = reviewed;
      newReview.title = title;
      newReview.rating = rating;
      if (review) newReview.review = review;
      await this.reviewRepository.save(newReview);
      return newReview;
    } catch (err) {
      throw new HttpException(err.response || `Failed to create review`, 400);
    }
  }

  @UseGuards(AuthGuardJwt)
  @Get(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  async getReview(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.reviewService.getReviewById(id);
    } catch (err) {
      throw new HttpException(`Failed to fetch reviews`, 400);
    }
  }

  @UseGuards(AuthGuardJwt)
  @Get()
  @UseInterceptors(ClassSerializerInterceptor)
  async searchReviews(@Query() query) {
    const {
      limit = 10,
      currentPage = 1,
      title,
      rating,
      authorId,
      reviewedId,
    } = query;
    const search = { title, rating, authorId, reviewedId };
    const paginator = { limit, total: true, currentPage };
    try {
      return await this.reviewService.getFilteredReviewsPaginated(
        paginator,
        search,
      );
    } catch (err) {
      throw new HttpException(`Failed to fetch reviews`, 400);
    }
  }

  @UseGuards(AuthGuardJwt)
  @Patch(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  async updateReview(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: updateReviewDto,
    @CurrentUser() user: User,
  ) {
    const { title, rating, review, status } = input;
    try {
      const reviewUpdate = await this.reviewRepository.findOne(id, {
        relations: ['author'],
      });
      if (!reviewUpdate)
        throw new HttpException(`Failed to fetch review with id ${id}`, 404);
      if (
        reviewUpdate.author.id !== user.id &&
        !user.roles.includes(Role.Admin)
      )
        throw new HttpException(`Unauthorized to update review id ${id}`, 404);
      if (title) reviewUpdate.title = title;
      if (rating) reviewUpdate.rating = rating;
      if (review) reviewUpdate.review = review;
      if (status) reviewUpdate.status = status;
      await this.reviewRepository.save(reviewUpdate);
      return reviewUpdate;
    } catch (err) {
      throw new HttpException(`Failed to update review`, 400);
    }
  }

  @UseGuards(AuthGuardJwt)
  @Delete(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(204)
  async removeReview(@Param('id') id, @CurrentUser() user: User) {
    try {
      const reviewDelete = await this.reviewRepository.findOne(id, {
        relations: ['author'],
      });
      if (!reviewDelete)
        throw new HttpException(`Review with id ${id} not found!`, 404);
      if (
        reviewDelete.author.id !== user.id &&
        !user.roles.includes(Role.Admin)
      )
        throw new HttpException(
          `Unauthorized to delete review with id ${id} not found!`,
          401,
        );
      const result = await this.reviewService.deleteReview(id);
      if (result?.affected !== 1)
        throw new HttpException(`Review with id ${id} not found!`, 404);
      else return true;
    } catch (err) {
      throw new HttpException(`Failed to delete review with id ${id}`, 404);
    }
  }
}
