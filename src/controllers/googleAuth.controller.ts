import { AuthService } from "@/services/auth.service";
import passport from "passport";
import { Container } from "typedi";
import { NextFunction, Request, Response } from "express";
import { User } from "@/interfaces/users.interface";
import { RequestWithUser } from "@/interfaces";
import { GoogleAuthService } from "@/services/googleAuth.service";
import { UpdateGoogleUserPhoneDto } from "@/dtos/googleUsers.dto";

export class GoogleAuthController {
    public authService = Container.get(AuthService);
    public googleAuthService = Container.get(GoogleAuthService);

    public googleOAuth = passport.authenticate('google', {
        scope: ['profile', 'email'],
    });

    public googleOAuthCallback = (req: Request, res: Response, next: NextFunction) => {
        passport.authenticate('google', {
            failureRedirect: '/login',
        }, async (err, user: User, info) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.redirect('/login');
            }
            
            try {
                // Generate JWT tokens for Google OAuth user
                const tokenResponse = await this.authService.createTokens(user, true);
                const cookies = this.authService.createCookies(tokenResponse);
                
                // Set JWT cookies
                res.setHeader('Set-Cookie', cookies);
                                
                // Redirect to dashboard with success
                res.redirect('/dashboard');
            } catch (error) {
                next(error);
            }
        })(req, res, next);
    };

    public updatePhoneNumber = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
        try {
            const phone: UpdateGoogleUserPhoneDto = req.body.phone;
            await this.googleAuthService.updatePhoneNumber(req.user.id, phone.phone);
            res.status(200).json({ message: 'Phone Number Updated Successfully' });
        } catch (error) {
            next(error);
        }
    };
}