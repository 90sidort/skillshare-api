import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from './../user/user.entity';

export enum ReviewStatusEnum {
  Accepted = 1,
  Pending,
}

@Entity()
export class Review {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ name: 'title', length: 400 })
  title: string;
  @Column({ name: 'review', length: 3000, nullable: true })
  review: string;
  @Column({ name: 'rating' })
  rating: number;
  @ManyToOne(() => User, (user) => user.authored)
  author: User;
  @ManyToOne(() => User, (user) => user.reviews)
  reviewed: User;
  @Column('enum', {
    enum: ReviewStatusEnum,
    default: ReviewStatusEnum.Pending,
  })
  status: ReviewStatusEnum;
  @CreateDateColumn({ type: 'timestamp' })
  @Exclude()
  createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp' })
  @Exclude()
  updatedAt: Date;
}
