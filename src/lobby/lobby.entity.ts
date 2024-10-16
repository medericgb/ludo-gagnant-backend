// src/lobby/lobby.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class Lobby {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => User, (user) => user.id)
  creator: User;

  @Column('simple-array', { nullable: true })
  participants: string[]; // Array of user IDs
}
