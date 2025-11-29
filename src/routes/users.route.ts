import { Router } from 'express';
import { UserController } from '@controllers/users.controller';
import { CreateUserDto } from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import { ValidationMiddleware } from '@middlewares/validation.middleware';

export class UserRoute implements Routes {
  public path = '/users';
  public router = Router();
  public user = new UserController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(
      '/users',
      /* #swagger.tags = ['Users'] */
      this.user.getUsers,
    );
    this.router.get(
      '/users/:id(\\d+)',
      /* #swagger.tags = ['Users'] */
      this.user.getUserById,
    );
    this.router.post(
      '/users',
      /* #swagger.tags = ['Users'] */
      ValidationMiddleware(CreateUserDto),
      this.user.createUser,
    );
    this.router.put(
      '/users/:id(\\d+)',
      /* #swagger.tags = ['Users'] */
      ValidationMiddleware(CreateUserDto, true),
      this.user.updateUser,
    );
    this.router.delete(
      '/users/:id(\\d+)',
      /* #swagger.tags = ['Users'] */
      this.user.deleteUser,
    );
  }
}
