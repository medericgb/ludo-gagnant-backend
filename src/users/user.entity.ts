import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
@Unique(['username', 'email', 'phoneNumber'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20 })
  username: string;

  @Column()
  email: string;

  @Column()
  phoneNumber: string;

  @Column()
  password: string;
}
