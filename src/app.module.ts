import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LobbyModule } from './lobby/lobby.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.local', // .env.production
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: 5432,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: 'ludo_gagnant',
      entities: ['dist/**/*.entity{.ts,.js}'],
      synchronize: true, // Disable in production DB_SYNCHRONIZE: false
    }),
    AuthModule,
    UsersModule,
    LobbyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
