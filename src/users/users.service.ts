import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { I18nContext, I18nService } from 'nestjs-i18n';
import type { SignOptions } from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';
import { PASSWORD_SALT_ROUNDS } from '../common/constants/app.constants';

type TokenPayload = {
  sub: number;
  email: string;
  username: string;
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly i18n: I18nService,
    private readonly configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { email, username, password } = createUserDto;

    const existingUser = await this.usersRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser) {
      throw new ConflictException(
        this.translate('users.errors.duplicateEmailOrUsername'),
      );
    }

    const hashedPassword = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

    const user = this.usersRepository.create({
      email,
      username,
      password: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(user);

    return UserResponseDto.createFromUser(savedUser);
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException(
        this.translate('users.errors.invalidCredentials'),
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException(
        this.translate('users.errors.invalidCredentials'),
      );
    }

    const accessToken = this.createAccessToken(user);
    const refreshToken = this.createRefreshToken(user);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const payload = this.verifyRefreshToken(refreshTokenDto.refresh_token);

    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException(
        this.translate('users.errors.invalidSession'),
      );
    }

    return {
      access_token: this.createAccessToken(user),
    };
  }

  async update(userId: number, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(this.translate('users.errors.notFound'));
    }

    const { password, ...profileUpdates } = updateUserDto;
    const updatePayload: Partial<
      Pick<User, 'email' | 'username' | 'password'>
    > = {
      ...profileUpdates,
    };

    if (password !== undefined) {
      updatePayload.password = await bcrypt.hash(
        password,
        PASSWORD_SALT_ROUNDS,
      );
    }

    Object.assign(user, updatePayload);

    const updatedUser = await this.usersRepository.save(user);

    return UserResponseDto.createFromUser(updatedUser);
  }

  private translate(key: string): string {
    return this.i18n.t(key, {
      lang: I18nContext.current()?.lang,
    });
  }

  private createAccessToken(user: User): string {
    return this.jwtService.sign(this.createTokenPayload(user));
  }

  private createRefreshToken(user: User): string {
    return this.jwtService.sign(this.createTokenPayload(user), {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>(
        'JWT_REFRESH_EXPIRES_IN',
      ) as SignOptions['expiresIn'],
    });
  }

  private verifyRefreshToken(refreshToken: string): TokenPayload {
    try {
      return this.jwtService.verify<TokenPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Invalid refresh token: ${message}`);

      throw new UnauthorizedException(
        this.translate('users.errors.invalidSession'),
      );
    }
  }

  private createTokenPayload(user: User): TokenPayload {
    return {
      sub: user.id,
      email: user.email,
      username: user.username,
    };
  }
}
