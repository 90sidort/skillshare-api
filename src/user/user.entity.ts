import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Role } from './authorization/role.enum';
import { Offer } from './../offer/offer.entity';
import { Exclude } from 'class-transformer';

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
  @Exclude({ toPlainOnly: true })
  password: string;
  @Column({ name: 'email', length: 300, unique: true })
  email: string;
  @Column({ name: 'about', length: 2000 })
  about: string;
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
  appliedCount: number;
  participatesCount: number;
  offeredCounts: number;
}
