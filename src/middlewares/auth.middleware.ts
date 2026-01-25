import { PrismaClient, Role } from '@prisma/client';
import { NextFunction, Response, Request } from 'express';
import { verify } from 'jsonwebtoken';
import { SECRET_KEY } from '@config';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, RequestWithUser } from '@interfaces/auth.interface';
import { User } from '@/interfaces';
import { ErrorMessages, createBilingualError } from '@/utils/errorMessages';
import prisma from '@/config/prisma';

const getAuthorization = (req: Request) => {
  const cookie = req.cookies['Authorization'];
  if (cookie) return cookie;

  const header = req.header('Authorization');
  if (header) return header.split('Bearer ')[1];

  return null;
};

export const AuthMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    // Check for JWT token
    const Authorization = getAuthorization(req);    
    if (Authorization) {
      const { id } = (await verify(Authorization, SECRET_KEY)) as DataStoredInToken;
      const users = prisma.user;
      const findUser: User = await users.findUnique({ where: { id } });

      if (findUser) {
        req.user = findUser;
        next();
      } else {
        const error = createBilingualError(401, ErrorMessages.WRONG_AUTHENTICATION_TOKEN);
        next(new HttpException(error.status, error.message, error.messageAr));
      }
    } else {
      const error = createBilingualError(401, ErrorMessages.AUTHENTICATION_REQUIRED);
      next(new HttpException(error.status, error.message, error.messageAr));
    }
  } catch (error) {
    const err = createBilingualError(401, ErrorMessages.WRONG_AUTHENTICATION_TOKEN);
    next(new HttpException(err.status, err.message, err.messageAr));
  }
};

export const RoleMiddleware = (...allowedRoles: Role[]) => {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (!req.user) {
      const error = createBilingualError(401, ErrorMessages.AUTHENTICATION_REQUIRED);
      return next(new HttpException(error.status, error.message, error.messageAr));
    }

    if (!allowedRoles.includes(req.user.role)) {
      const error = createBilingualError(403, {
        en: 'Access denied. Insufficient permissions.',
        ar: 'تم رفض الوصول. صلاحيات غير كافية.'
      });
      return next(new HttpException(error.status, error.message, error.messageAr));
    }

    next();
  };
};
