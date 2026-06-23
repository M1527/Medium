import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

type JwtExpiresIn = NonNullable<JwtSignOptions['expiresIn']>;

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow<JwtExpiresIn>('JWT_EXPIRES_IN'),
        },
      }),
    }),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: Logger,
      useFactory: () => new Logger(UsersService.name),
    },
  ],
})
export class UsersModule {}
