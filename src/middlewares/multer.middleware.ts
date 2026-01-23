import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { createBilingualError, ErrorMessages } from '@/utils/errorMessages';
import { HttpException } from '@/exceptions/HttpException';

// We use diskStorage so the file is saved to a 'temp' folder first.
const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        cb(null, 'uploads/');
    },
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        // We create a unique name: "doctor-timestamp.jpg"
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// 2. Filter to accept ONLY images
const fileFilter = (req: Request, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true); // Accept file
    } else {
        const bilingualError = createBilingualError(400, ErrorMessages.UNSUPPORTED_FILE_FORMAT);
        const error = new HttpException(bilingualError.status, bilingualError.message, bilingualError.messageAr);
        cb(error, false); // Reject file
    }
};

// 3. Initialize Multer with limits
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 3 // Limit file size to 3MB
    }
});

export default upload;