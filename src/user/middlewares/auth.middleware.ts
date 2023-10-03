import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { JWT_SECRET } from 'src/config';
import { ExpressRequest } from 'src/types/expressRequest.interface';
import { UserService } from '../user.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly userService: UserService) {}
  async use(req: ExpressRequest, res: Response, next: NextFunction) {
    if (!req.headers.authorization) {
      req.user = null;
      next();
      return;
    }

    const token = req.headers.authorization.split(' ')[1];

    try {
      verify(token, JWT_SECRET, async (err: any, payload: any) => {
        try {
          if (err) {
            throw new HttpException(
              'Login to your account...',
              HttpStatus.UNAUTHORIZED,
            );
          } else {
            const { id } = payload;
            const user = await this.userService.findByID(id);
            if (!user) {
              throw new HttpException(
                'Login to your account...',
                HttpStatus.UNAUTHORIZED,
              );
            }
            req.user = user;
            return next();
          }
        } catch (err) {
          next(err);
        }
      });
    } catch (err) {
      req.user = null;
      next(err);
    }
  }
}
