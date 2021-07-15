import { Category } from 'src/categories/category.entity';
import { Offer } from 'src/offer/offer.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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
  createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
  @Column()
  categoryId: number;
  offersCount?: number;
  offersAccepted?: number;
  offersPending?: number;
}
