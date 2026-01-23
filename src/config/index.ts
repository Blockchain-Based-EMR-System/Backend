import { config } from 'dotenv';
config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const CREDENTIALS = process.env.CREDENTIALS === 'true';

export const { NODE_ENV, PORT, SECRET_KEY, LOG_FORMAT, LOG_DIR, ORIGIN, REFRESH_TOKEN_SECRET,
    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SESSION_SECRET, GOOGLE_CALLBACK_URL,
    GMAIL_USER, GMAIL_APP_PASSWORD,
    FRONTEND_URL, SENDER_EMAIL,
    CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

export const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d'; // Default 7 days
export const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '1h'; // Default 1 hour
