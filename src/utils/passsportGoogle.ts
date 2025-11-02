import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } from '@/config';
import { PrismaClient } from '@prisma/client';
import { CreateGoogleUsersDto } from '@/dtos/googleUsers.dto';
import { createInitialProfileGoogle } from '@/services/googleAuth.service';
import { User } from '@/interfaces';

const prisma = new PrismaClient();

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL
},
    // This "verify" function is called when Google successfully authenticates the user.
    // 'profile' contains the user's Google profile information.
    // 'done' is a callback you must call to tell Passport the authentication is complete.
    async (accessToken, refreshToken, profile: Profile, done) => {
        try {
            console.log("Google profile:", profile);

            // Extract email from Google profile
            const email = profile.emails?.[0]?.value;
            const name = profile.displayName;
            
            if (!email) {
                return done(new Error('No email found in Google profile'), undefined);
            }

            // Find user in database by email
            const user = await prisma.user.findUnique({
                where: { email }
            });

            if (!user) {
                const newGoogleUserData: CreateGoogleUsersDto = {
                    email,
                    name,
                };
                const createdUser:User = await createInitialProfileGoogle(newGoogleUserData);
                return done(null, createdUser);
            }
            return done(null, user);
        } catch (error) {
            console.error('Error in Google authentication:', error);
            return done(error as Error, undefined);
        }
    }
));
