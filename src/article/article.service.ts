import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateArticleDto } from './dto/createArticle.dto';
import { ArticleEntity } from './article.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { UserEntity } from 'src/user/user.entity';
import { ArticleResponseInterface } from './types/articleResponse.interface';
import slugify from 'slugify';
import { UpdateArticleDto } from './dto/updateArticle.dto';
import { ArticlesResponseInterface } from './types/articlesResponse.interface';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findAll(
    currentUserId: number,
    query: any,
  ): Promise<ArticlesResponseInterface> {
    const queryBuilder = this.articleRepository
      .createQueryBuilder('articles')
      .leftJoinAndSelect('articles.author', 'author');

    //   با روش زیر میایم یه میگیم که اگه اسم تگی اورده شد بر اساس اون تگ برگردونه
    // http://localhost:3000/articles?tag=test-1

    if (query.tag) {
      queryBuilder.andWhere('articles.tagList LIKE :tag', {
        tag: `%${query.tag}`,
      });
    }

    //   با استفاده از این خط کد ما اومدیم مقاله هارو از آخر به اول مرتب سازی کردیم

    queryBuilder.orderBy('articles.createdAt', 'DESC');

    const articleCount = await queryBuilder.getCount();

    // ما با استفاده از تعیین کردن لیمیت میایم تعداد مقاله های بازگشتی رو تعیین میکنیم و با استفاده از آفست میاییم میگیم که از این ایندکس به بعد رو نشون بده
    // http://localhost:3000/articles?limit=2&offset=1

    if (query.limit) {
      queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder.offset(query.offset);
    }
    // برای استفاده از این موارد ما می بایست که مقاله ها رو در آخر بگیریم مانند زیر

    const articles = await queryBuilder.getMany();
    return { articles, articleCount };
  }

  async createArticle(
    currentUser: UserEntity,
    createArticleDto: CreateArticleDto,
  ): Promise<ArticleEntity> {
    const article = new ArticleEntity();
    Object.assign(article, createArticleDto);
    if (!article.tagList) {
      article.tagList = [];
    }
    article.author = currentUser;
    article.slug = this.getSlug(createArticleDto.title);
    return await this.articleRepository.save(article);
  }

  buildArticleResponse(article: ArticleEntity): ArticleResponseInterface {
    return { article };
  }

  private getSlug(title: string): string {
    return (
      slugify(title, { lower: true }) +
      '-' +
      ((Math.random() * Math.pow(36, 6)) | 0)
    );
  }

  async findBySlug(slug: string): Promise<ArticleEntity> {
    return this.articleRepository.findOne({
      where: { slug: slug },
    });
  }

  async deleteArticle(
    slug: string,
    currentUserID: number,
  ): Promise<DeleteResult> {
    const article = await this.findBySlug(slug);

    if (!article) {
      throw new HttpException('article does not exist', HttpStatus.NOT_FOUND);
    }

    if (article.author.id !== currentUserID) {
      throw new HttpException('you are not an author', HttpStatus.FORBIDDEN);
    }

    return await this.articleRepository.delete({ slug });
  }

  async updateArticle(
    slug: string,
    updateArticleDto: UpdateArticleDto,
    currentUserID: number,
  ) {
    const article = await this.findBySlug(slug);

    if (!article) {
      throw new HttpException('article does not exist', HttpStatus.NOT_FOUND);
    }

    if (article.author.id !== currentUserID) {
      throw new HttpException('you are not an author', HttpStatus.FORBIDDEN);
    }

    Object.assign(article, updateArticleDto);

    return await this.articleRepository.save(article);
  }
}
