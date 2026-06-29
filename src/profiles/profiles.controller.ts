import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { ProfilesService } from './profiles.service';

@ApiTags('profiles')
@ApiBearerAuth()
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':username')
  findByUsername(@Param('username') username: string, @Request() req) {
    return this.profilesService.findByUsername(username, req.user?.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':username/follow')
  follow(@Param('username') username: string, @Request() req) {
    return this.profilesService.follow(req.user.userId, username);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':username/follow')
  unfollow(@Param('username') username: string, @Request() req) {
    return this.profilesService.unfollow(req.user.userId, username);
  }
}