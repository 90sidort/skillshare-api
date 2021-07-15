import { Expose } from 'class-transformer';
import { Offer } from 'src/offer/offer.entity';
import { Profile } from 'src/profile/profile.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  @Expose()
  id: number;
  @Column({ name: 'username', length: 300, unique: true })
  @Expose()
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
  @Expose()
  about: string;
  @OneToMany(() => Offer, (offer) => offer.owner, { nullable: true })
  @Expose()
  offers: Offer[];
  @ManyToMany(() => Offer, (offer) => offer.participants, {
    nullable: true,
    // eager: true,
  })
  @Expose()
  participates: Offer[];
  @OneToOne(() => Profile)
  @Expose()
  @JoinColumn()
  profile: Profile;
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
