import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

import { Role } from './authorization/role.enum';
import { Offer } from './../offer/offer.entity';
import { Review } from './../review/review.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ name: 'username', length: 300, unique: true })
  username: string;
  @Column({ name: 'name', length: 300 })
  name: string;
  @Column({ name: 'surname', length: 300 })
  surname: string;
  @Column({ name: 'password', length: 100 })
  @Exclude()
  password: string;
  @Column({ name: 'email', length: 300, unique: true })
  email: string;
  @Column({ name: 'about', length: 2000 })
  about: string;
  @OneToMany(() => Review, (review) => review.author, { nullable: true })
  authored: Review[];
  @OneToMany(() => Review, (review) => review.reviewed, { nullable: true })
  reviews: Review[];
  @OneToMany(() => Offer, (offer) => offer.owner, { nullable: true })
  offers: Offer[];
  @ManyToMany(() => Offer, (offer) => offer.participants, {
    nullable: true,
  })
  participates: Offer[];
  @ManyToMany(() => Offer, (offer) => offer.applicants, {
    nullable: true,
  })
  applied: Offer[];
  @CreateDateColumn({ type: 'timestamp' })
  @Exclude()
  createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp' })
  @Exclude()
  updatedAt: Date;
  @Column('enum', { enum: [Role.Admin, Role.User], default: [Role.User] })
  roles: Role[];
  @Column({
    name: 'imagepath',
    nullable: false,
    default: 'cheems_user2021-08-11T14:04:50.726Z.jpg',
  })
  imagepath: string;
  appliedCount: number;
  participatesCount: number;
  offeredCounts: number;
}
