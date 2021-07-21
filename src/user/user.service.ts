import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DeleteResult, Repository } from 'typeorm';

import { paginate, PaginateOptions } from './../pagination/paginator';
import { userSearchQuery } from './user.dto';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  private getUserBaseQuery() {
    return this.userRepository.createQueryBuilder('u').orderBy('u.id', 'DESC');
  }
  public getTokenForUser(user: User): string {
    return this.jwtService.sign({
      username: user.username,
      sub: user.id,
    });
  }
  public async comparePasswords(passwordSaved: string, passwordGiven: string) {
    return await bcrypt.compare(passwordGiven, passwordSaved);
  }
  public async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }
  private getUsersWithCounts() {
    return this.getUserBaseQuery()
      .loadRelationCountAndMap('u.appliedCount', 'u.applied')
      .loadRelationCountAndMap('u.offeredCounts', 'u.offers')
      .loadRelationCountAndMap('u.participatesCount', 'u.participates');
  }
  private searchUsersWithCount(search: userSearchQuery) {
    const { username, email } = search;
    const base = this.getUsersWithCounts();
    if (username)
      base.andWhere('LOWER(u.username) like LOWER(:username)', {
        username: `%${username}%`,
      });
    if (email)
      base.andWhere('LOWER(u.email) like LOWER(:email)', {
        email: `%${email}%`,
      });
    return base;
  }
  public async getFilteredUsersPaginated(
    paginateOptions: PaginateOptions,
    search: userSearchQuery,
  ) {
    return await paginate(this.searchUsersWithCount(search), paginateOptions);
  }
  public async getUserById(id: number) {
    return await this.getUserBaseQuery()
      .andWhere('u.id = :id', {
        id,
      })
      .getOne();
  }
  public async getUserWithCountsAndRelations(id: number) {
    return await this.getUsersWithCounts()
      .andWhere('u.id = :id', {
        id,
      })
      .leftJoin('u.offers', 'offers')
      .leftJoin('u.participates', 'participates')
      .leftJoin('u.applied', 'applied')
      .select([
        'u',
        'offers.id',
        'offers.title',
        'participates.id',
        'participates.title',
        'applied.id',
        'applied.title',
      ])
      .getOne();
  }
  public async deleteUser(id: number): Promise<DeleteResult> {
    return await this.userRepository
      .createQueryBuilder('u')
      .delete()
      .where('id = :id', { id })
      .execute();
  }
}
