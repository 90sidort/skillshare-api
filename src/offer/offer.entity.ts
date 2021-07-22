import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Skill } from './../skills/skill.entity';
import { User } from './../user/user.entity';

export enum OfferStatusEnum {
  Accepted = 1,
  Pending,
}

@Entity()
export class Offer {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ name: 'title', length: 300 })
  title: string;
  @Column({ name: 'description', length: 2000 })
  description: string;
  @ManyToOne(() => Skill, (skill) => skill.offers, { nullable: false })
  skill: Skill;
  @ManyToOne(() => User, (user) => user.offers, { nullable: false })
  owner: User;
  @ManyToMany(() => User, (user) => user.participates, {
    nullable: true,
    cascade: true,
  })
  @JoinTable()
  participants: User[];
  @ManyToMany(() => User, (user) => user.applied, {
    nullable: true,
    cascade: true,
  })
  @JoinTable()
  applicants: User[];
  @CreateDateColumn({ type: 'timestamp' })
  @Exclude()
  createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp' })
  @Exclude()
  updatedAt: Date;
  @Column({ default: true })
  available: boolean;
  @Column({ default: 3 })
  limit: number;
  @Column()
  ownerId: number;
  @Column()
  skillId: number;
  @Column('enum', {
    enum: OfferStatusEnum,
    default: OfferStatusEnum.Pending,
  })
  status: OfferStatusEnum;
  applicantCount: number;
  participantCount: number;
}
