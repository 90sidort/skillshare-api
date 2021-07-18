import { Offer } from 'src/offer/offer.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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
  createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
  appliedCount: number;
  participatesCount: number;
  offeredCounts: number;
}
