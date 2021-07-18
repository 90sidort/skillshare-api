import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { paginate, PaginateOptions } from 'src/pagination/paginator';
import { DeleteResult, Repository } from 'typeorm';
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
  public async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }
  public getUsersWithCounts() {
    return this.getUserBaseQuery()
      .loadRelationCountAndMap('u.appliedCount', 'u.applied')
      .loadRelationCountAndMap('u.offeredCounts', 'u.offers')
      .loadRelationCountAndMap('u.participatesCount', 'u.participates');
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
}
