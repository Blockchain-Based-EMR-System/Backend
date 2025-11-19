import multer, { FileFilterCallback } from "multer";
import { Request } from 'express';
import { HttpException } from "@/exceptions/HttpException";


const storage = multer.memoryStorage();
const allowed_file_types = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
    'text/plain',
];


const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (allowed_file_types.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new HttpException(400, `file type not allowed`))
    }
};


const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 300 * 1024 * 1024,
    },
});


export const uploadSingleFile = upload.single('file');
export const uploadMultipleFiles = upload.array('files', 3);