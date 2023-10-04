import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { AuthGuard } from 'src/user/guard/auth.guard';
import { User } from 'src/user/decorators/user.decorators';
import { CreateArticleDto } from './dto/createArticle.dto';
import { UserEntity } from 'src/user/user.entity';
import { ArticleResponseInterface } from './types/articleResponse.interface';
import { UpdateArticleDto } from './dto/updateArticle.dto';
import { DeleteResult } from 'typeorm';
import { ArticlesResponseInterface } from './types/articlesResponse.interface';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  async findAll(
    @User('id') currentUserId: number,
    // برای اینکه بتونیم تمامی موارد رو برگردونیم اومدیم از کوری استفاده کردیم
    @Query() query: any,
  ): Promise<ArticlesResponseInterface> {
    return await this.articleService.findAll(currentUserId, query);
  }

  @Post()
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
  async createArticle(
    @User() currentUser: UserEntity,
    @Body() createArticleDto: CreateArticleDto,
  ): Promise<ArticleResponseInterface> {
    const article = await this.articleService.createArticle(
      currentUser,
      createArticleDto,
    );
    return this.articleService.buildArticleResponse(article);
  }

  @Get(':slug')
  async getSingleArticle(
    @Param('slug') slug: string,
  ): Promise<ArticleResponseInterface> {
    const article = await this.articleService.findBySlug(slug);
    return this.articleService.buildArticleResponse(article);
  }

  @Delete(':slug')
  @UseGuards(AuthGuard)
  async deleteArticle(
    @User('id') currentUserID: number,
    @Param('slug') slug: string,
  ): Promise<DeleteResult> {
    return await this.articleService.deleteArticle(slug, currentUserID);
  }

  @Put(':slug')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
  async updateArticle(
    @User('id') currentUserID: number,
    @Param('slug') slug: string,
    @Body('') updateArticleDto: UpdateArticleDto,
  ) {
    const article = await this.articleService.updateArticle(
      slug,
      updateArticleDto,
      currentUserID,
    );
    return await this.articleService.buildArticleResponse(article);
  }
}
