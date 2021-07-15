import { Skill } from 'src/skills/skill.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ name: 'name', length: 400, unique: true })
  name: string;
  @OneToMany(() => Skill, (skill) => skill.category, { nullable: true })
  skills: Skill[];
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
  skillCount: number;
}
