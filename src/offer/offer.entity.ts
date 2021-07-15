import { Expose } from 'class-transformer';
import { Skill } from 'src/skills/skill.entity';
import { User } from 'src/user/user.entity';
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

export enum OfferStatusEnum {
  Accepted = 1,
  Pending,
}

@Entity()
export class Offer {
  @PrimaryGeneratedColumn()
  @Expose()
  id: number;
  @Column({ name: 'title', length: 300 })
  @Expose()
  title: string;
  @Column({ name: 'description', length: 2000 })
  @Expose()
  description: string;
  @ManyToOne(() => Skill, (skill) => skill.offers, { nullable: false })
  @Expose()
  skill: Skill;
  @ManyToOne(() => User, (user) => user.offers, { nullable: false })
  @Expose()
  owner: User;
  @ManyToMany(() => User, (user) => user.participates, {
    nullable: true,
    cascade: true,
  })
  @JoinTable()
  @Expose()
  participants: User[];
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column()
  @Expose()
  ownerId: number;

  @Column('enum', {
    enum: OfferStatusEnum,
    default: OfferStatusEnum.Pending,
  })
  @Expose()
  status: OfferStatusEnum;
}
