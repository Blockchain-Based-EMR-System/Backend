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
                $password: 'password123',
                $rememberMe: false
            }
        }
        #swagger.responses[201] = {
            description: 'User successfully created',
            schema: {
                data: {
                    id: 1,
                    email: 'user@example.com',
                    name: 'John Doe',
                    phone: '1234567890',
                    isEmailVerified: false,
                    hasCompletedProfile: false,
                    gender: null,
                    date_of_birth: null,
                    role: 'PATIENT',
                    photoUrl: null
                },
                messageEn: 'Signed Up Successfully',
                messageAr: "تم انشاء الحساب بنجاح"
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
        #swagger.responses[200] = {
            description: 'Login successful',
            schema: {
                data: { id: 1, email: 'user@example.com', name: 'John Doe', role: 'PATIENT' , doctor: { specialization: 'Cardiology', account_status: 'APPROVED' } },
                messageEn: 'Logged In Successfully',
                messageAr: "تم تسجيل الدخول بنجاح"
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
            description: 'Bearer access token (sent via Authorization cookie)',
            required: false,
            type: 'string'
        }
        #swagger.responses[200] = {
            description: 'Logout successful',
            schema: { messageEn: 'Logged Out Successfully', messageAr: "تم تسجيل الخروج بنجاح" }
        }
      */
      AuthMiddleware,
      this.auth.logOut,
    );

    this.router.post(
      `/auth/refresh`,
      /* 
        #swagger.tags = ['Auth']
        #swagger.parameters['RefreshToken'] = {
            in: 'header',
            description: 'Refresh token (sent via RefreshToken cookie)',
            required: false,
            type: 'string'
        }
        #swagger.responses[200] = {
            description: 'Token refreshed successfully',
            schema: {
                data: { user: {}, accessToken: { expiresIn: 3600, expiresAt: '2025-12-12T12:00:00.000Z' } },
                messageEn: 'Token Refreshed Successfully',
                messageAr: "تم تحديث الرمز بنجاح"
            }
        }
      */
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
        #swagger.parameters['Authorization'] = {
            in: 'header',
            description: 'Bearer access token (sent via Authorization cookie)',
            required: false,
            type: 'string'
        }
        #swagger.responses[200] = {
            description: 'Profile completed successfully',
            schema: {
                data: { id: 1, hasCompletedProfile: true },
                messageEn: 'Profile Completed Successfully',
                messageAr: "تم إكمال الملف الشخصي بنجاح"
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
        #swagger.parameters['body'] = {
            in: 'body',
            description: 'Verify OTP',
            required: true,
            schema: { $otp: '123456' }
        }
        #swagger.parameters['Authorization'] = {
            in: 'header',
            description: 'Bearer access token (sent via Authorization cookie or)',
            required: false,
            type: 'string'
        }
        #swagger.responses[200] = {
            description: 'OTP verified successfully',
            schema: {
                data: true,
                messageEn: 'OTP Verified Successfully',
                messageAr: "تم التحقق من رمز التحقق بنجاح"
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
            schema: { $email: 'user@example.com' }
        }
        #swagger.responses[200] = {
            description: 'Password reset email sent',
            schema: { messageEn: 'Password Reset Email Sent Successfully', messageAr: "تم إرسال بريد إعادة تعيين كلمة المرور بنجاح" }
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
        #swagger.responses[200] = {
            description: 'Password reset successfully',
            schema: { messageEn: 'Password Reset Successfully', messageAr: "تم إعادة تعيين كلمة المرور بنجاح" }
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
            description: 'Bearer access token (sent via Authorization cooki)',
            required: false,
            type: 'string'
        }
        #swagger.responses[200] = {
            description: 'OTP resent successfully',
            schema: { messageEn: 'OTP Resent Successfully', messageAr: "تم إعادة إرسال رمز التحقق بنجاح" }
        }
      */
      AuthMiddleware,
      this.auth.resendOTP,
    );

    this.router.get(
      `/auth/google`,
      /* 
        #swagger.tags = ['Auth']
        #swagger.responses[302] = {
            description: 'Redirects to Google OAuth consent page'
        }
      */
      this.googleAuth.googleOAuth,
    );

    this.router.get(
      `/auth/google/callback`,
      /* 
        #swagger.tags = ['Auth']
        #swagger.responses[302] = {
            description: 'Redirects after Google authentication'
        }
      */
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
            schema: { $phone: '1234567890' }
        }
        #swagger.parameters['Authorization'] = {
            in: 'header',
            description: 'Bearer access token (sent via Authorization cookie or)',
            required: false,
            type: 'string'
        }
        #swagger.responses[200] = {
            description: 'Phone number updated successfully',
            schema: {
                data: { phone: '1234567890' },
                messageEn: 'Phone number updated successfully',
                messageAr: "تم تحديث رقم الهاتف بنجاح"
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
            description: 'Bearer access token (sent via Authorization cookie)',
            required: false,
            type: 'string'
        }
        #swagger.responses[200] = {
            description: 'User data retrieved successfully',
            schema: {
                data: { email: 'user@example.com', name: 'John Doe', username: 'johndoe', phone: '1234567890', gender: 'MALE' , date_of_birth: '1990-01-01', isVerified: false, hasCompletedProfile: false },
                messageEn: 'User data retrieved successfully',
                messageAr: "تم استرجاع بيانات المستخدم بنجاح"
            }
        }
      */
      AuthMiddleware,
      this.googleAuth.getGoogleUserData,
    );
  }
}
