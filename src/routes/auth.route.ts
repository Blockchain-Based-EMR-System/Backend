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
    this.router.post(
      `/auth/signup`,
      /* 
        #swagger.tags = ['Auth']
        #swagger.parameters['body'] = {
            in: 'body',
            description: 'User signup data',
            required: true,
            schema: {
                $email: 'user@example.com',
                $name: 'John Doe',
                $phone: '1234567890',
                $password: 'password123'
            }
        }
      */
      ValidationMiddleware(CreateUserDto),
      this.auth.signUp,
    );

    this.router.post(
      `/auth/login`,
      /* 
        #swagger.tags = ['Auth']
        #swagger.parameters['body'] = {
            in: 'body',
            description: 'User login data',
            required: true,
            schema: {
                $emailOrUsername: 'user@example.com',
                $password: 'password123',
                rememberMe: false
            }
        }
      */
      ValidationMiddleware(LoginUserDto),
      this.auth.logIn,
    );

    this.router.post(
      `/auth/logout`,
      /* 
        #swagger.tags = ['Auth']
        #swagger.parameters['Authorization'] = {
            in: 'header',
            description: 'Bearer access token or cookie (e.g. Authorization: Bearer <token>)',
            required: true,
            type: 'string'
        }
      */
      AuthMiddleware,
      this.auth.logOut,
    );

    this.router.post(
      `/auth/refresh`,
      /* 
        #swagger.tags = ['Auth']
        #swagger.parameters['Authorization'] = {
            in: 'header',
            description: 'Refresh token in cookie or Authorization header. If using cookie, ensure cookies are sent.',
            required: true,
            type: 'string'
        }
      */
      AuthMiddleware,
      this.auth.refresh,
    );

    this.router.patch(
      `/auth/complete-profile-info`,
      /* 
        #swagger.tags = ['Auth']
        #swagger.parameters['body'] = {
            in: 'body',
            description: 'Complete user profile',
            required: true,
            schema: {
                $gender: 'Male',
                $date_of_birth: '1990-01-01'
            }
        }
      */
      ValidationMiddleware(CompleteUserProfileDto),
      /* 
        #swagger.parameters['Authorization'] = {
            in: 'header',
            description: 'Bearer access token',
            required: true,
            type: 'string'
        }
      */
      AuthMiddleware,
      this.auth.completeProfile,
    );

    this.router.patch(
      `/auth/verify-otp`,
      /* 
        #swagger.tags = ['Auth']
        #swagger.parameters['Authorization'] = {
            in: 'header',
            description: 'Bearer access token',
            required: true,
            type: 'string'
        }
        #swagger.parameters['body'] = {
            in: 'body',
            description: 'Verify OTP',
            required: true,
            schema: {
                $otp: '123456'
            }
        }
      */
      AuthMiddleware,
      this.auth.verifyOTP,
    );

    this.router.post(
      `/auth/forget-password`,
      /* 
        #swagger.tags = ['Auth']
        #swagger.parameters['body'] = {
            in: 'body',
            description: 'Request password reset',
            required: true,
            schema: {
                $email: 'user@example.com'
            }
        }
      */
      this.auth.forgetPassword,
    );

    this.router.post(
      `/auth/reset-password`,
      /* 
        #swagger.tags = ['Auth']
        #swagger.parameters['body'] = {
            in: 'body',
            description: 'Reset password',
            required: true,
            schema: {
                $token: 'reset-token',
                $newPassword: 'newPassword123'
            }
        }
      */
      ValidationMiddleware(ResetPasswordDto),
      this.auth.resetPassword,
    );

    this.router.post(
      `/auth/resend-otp`,
      /* 
        #swagger.tags = ['Auth']
        #swagger.parameters['Authorization'] = {
            in: 'header',
            description: 'Bearer access token',
            required: true,
            type: 'string'
        }
      */
      AuthMiddleware,
      this.auth.resendOTP,
    );

    this.router.get(
      `/auth/google`,
      /* #swagger.tags = ['Auth'] */
      this.googleAuth.googleOAuth,
    );

    this.router.get(
      `/auth/google/callback`,
      /* #swagger.tags = ['Auth'] */
      this.googleAuth.googleOAuthCallback,
    );

    this.router.patch(
      `/auth/google/update-phone`,
      /* 
        #swagger.tags = ['Auth']
        #swagger.parameters['body'] = {
            in: 'body',
            description: 'Update Google user phone',
            required: true,
            schema: {
                $phone: '1234567890'
            }
        }
      */
      ValidationMiddleware(UpdateGoogleUserPhoneDto),
      /* 
        #swagger.parameters['Authorization'] = {
            in: 'header',
            description: 'Bearer access token',
            required: true,
            type: 'string'
        }
      */
      AuthMiddleware,
      this.googleAuth.updatePhoneNumber,
    );

    this.router.get(
      `/auth/google/userData`,
      /* 
        #swagger.tags = ['Auth']
        #swagger.parameters['Authorization'] = {
            in: 'header',
            description: 'Bearer access token',
            required: true,
            type: 'string'
        }
      */
      AuthMiddleware,
      this.googleAuth.getGoogleUserData,
    );
  }
}
