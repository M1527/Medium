import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Request,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@ApiTags('articles')
@ApiBearerAuth()
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @ApiBody({ type: CreateArticleDto })
  create(@Body() createArticleDto: CreateArticleDto, @Request() req) {
    return this.articlesService.create(createArticleDto, req.user.userId);
  }

  @Get()
  findAll() {
    return this.articlesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.articlesService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
@Put(':id')
update(
  @Param('id', ParseIntPipe) id: number,
  @Body() updateArticleDto: UpdateArticleDto,
  @Request() req,
) {
  return this.articlesService.update(id, req.user.userId, updateArticleDto);
}

 @UseGuards(AuthGuard('jwt'))
@Delete(':id')
remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
  return this.articlesService.remove(id, req.user.userId);
}
}
