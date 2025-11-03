import { Router } from 'express';
import { AuthController } from '@controllers/auth.controller';
import { CompleteUserProfileDto, CreateUserDto, LoginUserDto, ResetPasswordDto } from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import { AuthMiddleware } from '@middlewares/auth.middleware';
import { GoogleAuthController } from '@/controllers/googleAuth.controller';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { UpdateGoogleUserPhoneDto } from '@/dtos/googleUsers.dto';

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
    this.router.post(`${this.path}/refresh`, AuthMiddleware, this.auth.refresh);
    this.router.patch(`${this.path}/complete-profile-info`, ValidationMiddleware(CompleteUserProfileDto), AuthMiddleware, this.auth.completeProfile);
    this.router.patch(`${this.path}/verify-otp`, AuthMiddleware, this.auth.verifyOTP);
    this.router.post(`${this.path}/forget-password`, this.auth.forgetPassword);
    this.router.post(`${this.path}/reset-password`, ValidationMiddleware(ResetPasswordDto), this.auth.resetPassword);

    this.router.get(`${this.path}/google`, this.googleAuth.googleOAuth);
    this.router.get(`${this.path}/google/callback`, this.googleAuth.googleOAuthCallback);
    this.router.patch(`${this.path}/google/update-phone`, ValidationMiddleware(UpdateGoogleUserPhoneDto), AuthMiddleware, this.googleAuth.updatePhoneNumber);
  }
}
