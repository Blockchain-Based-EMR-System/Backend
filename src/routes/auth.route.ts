import { Router } from 'express';
import { AuthController } from '@controllers/auth.controller';
import { CompleteUserProfileDto, CreateUserDto, LoginUserDto, ResetPasswordDto } from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import { AuthMiddleware } from '@middlewares/auth.middleware';
import { GoogleAuthController } from '@/controllers/googleAuth.controller';
import
/* #swagger.tags = ['auth'] */ { ValidationMiddleware } from '@middlewares/validation.middleware';
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
    this.router.post(
      `/auth/signup`,
      /* #swagger.tags = ['auth'] */
      ValidationMiddleware(CreateUserDto),
      this.auth.signUp,
    );

    this.router.post(
      `/auth/login`,
      /* #swagger.tags = ['auth'] */
      ValidationMiddleware(LoginUserDto),
      this.auth.logIn,
    );

    this.router.post(
      `/auth/logout`,
      /* #swagger.tags = ['auth'] */
      AuthMiddleware,
      this.auth.logOut,
    );

    this.router.post(
      `/auth/refresh`,
      /* #swagger.tags = ['auth'] */
      AuthMiddleware,
      this.auth.refresh,
    );

    this.router.patch(
      `/auth/complete-profile-info`,
      /* #swagger.tags = ['auth'] */
      ValidationMiddleware(CompleteUserProfileDto),
      AuthMiddleware,
      this.auth.completeProfile,
    );

    this.router.patch(
      `/auth/verify-otp`,
      /* #swagger.tags = ['auth'] */
      AuthMiddleware,
      this.auth.verifyOTP,
    );

    this.router.post(
      `/auth/forget-password`,
      /* #swagger.tags = ['auth'] */
      this.auth.forgetPassword,
    );

    this.router.post(
      `/auth/reset-password`,
      /* #swagger.tags = ['auth'] */
      ValidationMiddleware(ResetPasswordDto),
      this.auth.resetPassword,
    );

    this.router.post(
      `/auth/resend-otp`,
      /* #swagger.tags = ['auth'] */
      AuthMiddleware,
      this.auth.resendOTP,
    );

    this.router.get(
      `/auth/google`,
      /* #swagger.tags = ['auth'] */
      this.googleAuth.googleOAuth,
    );

    this.router.get(
      `/auth/google/callback`,
      /* #swagger.tags = ['auth'] */
      this.googleAuth.googleOAuthCallback,
    );

    this.router.patch(
      `/auth/google/update-phone`,
      /* #swagger.tags = ['auth'] */
      ValidationMiddleware(UpdateGoogleUserPhoneDto),
      AuthMiddleware,
      this.googleAuth.updatePhoneNumber,
    );

    this.router.get(
      `/auth/google/userData`,
      /* #swagger.tags = ['auth'] */
      AuthMiddleware,
      this.googleAuth.getGoogleUserData,
    );
  }
}
