import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Category } from './../categories/category.entity';
import { Offer } from './../offer/offer.entity';

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ name: 'name', length: 200 })
  name: string;
  @Column({ name: 'description', length: 400 })
  description: string;
  @OneToMany(() => Offer, (offer) => offer.skill)
  offers: Offer[];
  @ManyToOne(() => Category, (category) => category.skills, {
    nullable: false,
  })
  category: Category;
  @CreateDateColumn({ type: 'timestamp' })
  @Exclude()
  createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp' })
  @Exclude()
  updatedAt: Date;
  @Column()
  categoryId: number;
  offersCount?: number;
  offersAccepted?: number;
  offersPending?: number;
}
