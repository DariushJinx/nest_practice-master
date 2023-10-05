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

    // http://localhost:3000/articles?author=test
    // جایی که ما مطمنیم که پارامتر وارد شده ما دقیقا چی هست نیازی به استفاده از Like نیستش

    if (query.author) {
      // چون ما از فایند وان استفاده میکنیم باید مطمن بشیم که اسامی استفاده شده یونیک و منحصر به فرد هستند
      const author = await this.userRepository.findOne({
        where: { username: query.author },
      });
      queryBuilder.andWhere('articles.authorId = :id', {
        id: author.id,
      });
    }

    if (query.favored) {
      const author = await this.userRepository.findOne({
        where: { username: query.favored },
        relations: ['favorites'],
      });
      const ids = author.favorites.map((el) => el.id);
      if (ids.length > 0) {
        queryBuilder.andWhere('articles.authorId IN (:...ids)', { ids });
      } else {
        // این یه فالس برمیگردونه که بنا به همین یه آرایه خالی رو در نهایت به ما میده
        queryBuilder.andWhere('1=0');
      }
      console.log('author : ', author);
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

    let favoriteIds: number[] = [];

    if (currentUserId) {
      const currentUser = await this.userRepository.findOne({
        where: { id: currentUserId },
        relations: ['favorites'],
      });
      favoriteIds = currentUser.favorites.map((favorite) => favorite.id);
    }

    // برای استفاده از این موارد ما می بایست که مقاله ها رو در آخر بگیریم مانند زیر

    const articles = await queryBuilder.getMany();
    const articleWithFavored = articles.map((article) => {
      const favored = favoriteIds.includes(article.id);
      return { ...article, favored };
    });
    return { articles: articleWithFavored, articleCount };
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

  async addArticleToFavorites(
    slug: string,
    currentUserId: number,
  ): Promise<ArticleEntity> {
    const article = await this.findBySlug(slug);
    const user = await this.userRepository.findOne({
      where: { id: currentUserId },
      relations: ['favorites'],
    });
    const isNotFavorite =
      user.favorites.findIndex(
        (articleInFavorite) => articleInFavorite.id === article.id,
      ) === -1;

    if (isNotFavorite) {
      user.favorites.push(article);
      article.favoritesCount++;
      await this.userRepository.save(user);
      await this.articleRepository.save(article);
    }

    return article;
  }

  async deleteArticleFromFavorites(
    slug: string,
    currentUserId: number,
  ): Promise<ArticleEntity> {
    const article = await this.findBySlug(slug);
    const user = await this.userRepository.findOne({
      where: { id: currentUserId },
      relations: ['favorites'],
    });
    const articleIndex = user.favorites.findIndex(
      (articleInFavorite) => articleInFavorite.id === article.id,
    );

    if (articleIndex >= 0) {
      user.favorites.splice(articleIndex, 1);
      article.favoritesCount--;
      await this.userRepository.save(user);
      await this.articleRepository.save(article);
    }
    return article;
  }
}
