import { AuthService } from "@/services/auth.service";
import passport from "passport";
import { Container } from "typedi";
import { NextFunction, Request, Response } from "express";
import { User } from "@/interfaces/users.interface";

export class GoogleAuthController {
    public authService = Container.get(AuthService);

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
}