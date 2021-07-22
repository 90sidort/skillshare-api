import { Skill } from './../skills/skill.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ name: 'name', length: 400, unique: true })
  name: string;
  @OneToMany(() => Skill, (skill) => skill.category, {
    nullable: true,
    cascade: true,
  })
  skills: Skill[];
  @CreateDateColumn({ type: 'timestamp' })
  @Exclude()
  createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp' })
  @Exclude()
  updatedAt: Date;
  skillCount: number;
}
