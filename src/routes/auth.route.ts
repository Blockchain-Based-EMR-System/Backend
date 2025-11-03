import { Router } from 'express';
import { AuthController } from '@controllers/auth.controller';
import { CreateUserDto, LoginUserDto } from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import { AuthMiddleware } from '@middlewares/auth.middleware';
import { GoogleAuthController } from '@/controllers/googleAuth.controller';
import { ValidationMiddleware } from '@middlewares/validation.middleware';

export class AuthRoute implements Routes {
  public path = '/auth';
  public router = Router();
  public auth = new AuthController();
  public googleAuth = new GoogleAuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/signup`, ValidationMiddleware(CreateUserDto), this.auth.signUp);
    this.router.post(`${this.path}/login`, ValidationMiddleware(LoginUserDto), this.auth.logIn);
    this.router.post(`${this.path}/logout`, AuthMiddleware, this.auth.logOut);
    this.router.post(`${this.path}/refresh`, AuthMiddleware ,this.auth.refresh);
    this.router.patch(`${this.path}/complete-profile-info`, AuthMiddleware, this.auth.completeProfile);
    this.router.patch(`${this.path}/verify-otp`, AuthMiddleware ,this.auth.verifyOTP);
    

    this.router.get(`${this.path}/google`, this.googleAuth.googleOAuth);
    this.router.get(`${this.path}/google/callback`, this.googleAuth.googleOAuthCallback);
    this.router.patch(`${this.path}/google/update-phone`, AuthMiddleware, this.googleAuth.updatePhoneNumber);
  }
}
