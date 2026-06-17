import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { BCRYPT_SALT_ROUNDS } from '../common/constants/app.constants';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';

type JwtExpiresIn = NonNullable<JwtSignOptions['expiresIn']>;
type TokenType = 'access' | 'refresh';

interface TokenPayload {
  sub: number;
  email: string;
  username: string;
  tokenType: TokenType;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly i18n: I18nService,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
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

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

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

    return this.createTokenPair(user);
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const payload = this.verifyRefreshToken(refreshTokenDto.refresh_token);

    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException(
        this.translate('users.errors.invalidSession'),
      );
    }

    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException(
        this.translate('users.errors.invalidSession'),
      );
    }

    return this.createTokenPair(user);
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
      updatePayload.password = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    }

    Object.assign(user, updatePayload);

    const updatedUser = await this.usersRepository.save(user);

    return UserResponseDto.createFromUser(updatedUser);
  }

  private translate(key: string): string {
    return this.i18n.t(key, { lang: I18nContext.current()?.lang });
  }

  private createTokenPair(user: User) {
    return {
      access_token: this.createAccessToken(user),
      refresh_token: this.createRefreshToken(user),
    };
  }

  private createAccessToken(user: User): string {
    return this.jwtService.sign(this.createTokenPayload(user, 'access'), {
      expiresIn: this.configService.getOrThrow<JwtExpiresIn>('JWT_EXPIRES_IN'),
    });
  }

  private createRefreshToken(user: User): string {
    const refreshSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');

    return this.jwtService.sign(this.createTokenPayload(user, 'refresh'), {
      secret: refreshSecret,
      expiresIn: this.configService.getOrThrow<JwtExpiresIn>(
        'JWT_REFRESH_EXPIRES_IN',
      ),
    });
  }

  private verifyRefreshToken(refreshToken: string): TokenPayload {
    const refreshSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');

    try {
      return this.jwtService.verify<TokenPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch (error) {
      this.logJwtRefreshVerificationFailure(error);
      return this.throwInvalidSessionException();
    }
  }

  private logJwtRefreshVerificationFailure(error: unknown): void {
    this.logger.warn({
      message: 'JWT refresh verification failed',
      reason: error instanceof Error ? error.name : 'UnknownError',
    });
  }

  private throwInvalidSessionException(): never {
    throw new UnauthorizedException(
      this.translate('users.errors.invalidSession'),
    );
  }

  private createTokenPayload(user: User, tokenType: TokenType): TokenPayload {
    return {
      sub: user.id,
      email: user.email,
      username: user.username,
      tokenType,
    };
  }
}
