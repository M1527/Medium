import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entitiy';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly i18n: I18nService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { email, username, password } = createUserDto;

    const existingUser = await this.usersRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser) {
      throw new ConflictException(this.translate('users.emailOrUsernameExists'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.usersRepository.create({
      email,
      username,
      password: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(user);

    const { password: _, ...result } = savedUser;
    return result;
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException(this.translate('users.invalidCredentials'));
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException(this.translate('users.invalidCredentials'));
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      username: user.username,
    });

    return {
      access_token: accessToken,
    };
  }

  async update(userId: number, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(this.translate('users.notFound'));
    }

    if (updateUserDto.email !== undefined) {
      user.email = updateUserDto.email;
    }

    if (updateUserDto.username !== undefined) {
      user.username = updateUserDto.username;
    }

    if (updateUserDto.password !== undefined) {
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.usersRepository.save(user);

    const { password, ...result } = updatedUser;
    return result;
  }

  private translate(key: string): string {
    return this.i18n.t(key, {
      lang: I18nContext.current()?.lang,
    });
  }
}
