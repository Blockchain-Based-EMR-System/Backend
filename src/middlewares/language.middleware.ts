import { NextFunction, Request, Response } from 'express';

export interface RequestWithLanguage extends Request {
    language?: 'en' | 'ar';
}

/**
 * Middleware to extract language preference from request headers
 * Checks for 'Accept-Language' or custom 'X-Language' header
 */
export const LanguageMiddleware = (req: RequestWithLanguage, res: Response, next: NextFunction) => {
    // Check custom header first
    const customLang = req.header('X-Language')?.toLowerCase();

    if (customLang === 'ar' || customLang === 'arabic') {
        req.language = 'ar';
    } else if (customLang === 'en' || customLang === 'english') {
        req.language = 'en';
    } else {
        // Check Accept-Language header
        const acceptLang = req.header('Accept-Language')?.toLowerCase();

        if (acceptLang?.includes('ar')) {
            req.language = 'ar';
        } else {
            req.language = 'en'; // Default to English
        }
    }

    next();
};
