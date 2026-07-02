import { plainToInstance } from 'class-transformer';
import { validateOrReject, ValidationError } from 'class-validator';
import { NextFunction, Request, Response } from 'express';
import { HttpException } from '@exceptions/HttpException';
import { createBilingualError, ErrorMessages } from '@/utils/errorMessages';

/**
 * @name ValidationMiddleware
 * @description Allows use of decorator and non-decorator based validation
 * @param type dto (pass null to skip DTO validation when only validating file upload)
 * @param skipMissingProperties When skipping missing properties
 * @param whitelist Even if your object is an instance of a validation class it can contain additional properties that are not defined
 * @param forbidNonWhitelisted If you would rather to have an error thrown when any non-whitelisted properties are present
 * @param requireFile When true, validates that a file has been uploaded via multer (checks req.file or req.files)
 */
export const ValidationMiddleware = (
  type: any = null,
  skipMissingProperties = false,
  whitelist = false,
  forbidNonWhitelisted = false,
  requireFile = false,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Validate file upload if required
    if (requireFile) {
      const hasFile = req.file || (req.files && (Array.isArray(req.files) ? req.files.length > 0 : Object.keys(req.files).length > 0));
      if (!hasFile) {
        const error = createBilingualError(400, ErrorMessages.NO_FILE_UPLOADED)
        return next(new HttpException(400, error.message, error.messageAr));
      }
    }

    // Skip DTO validation if type is null (file-only validation)
    if (type === null) {
      return next();
    }

    const dto = plainToInstance(type, req.body);
    validateOrReject(dto, { skipMissingProperties, whitelist, forbidNonWhitelisted })
      .then(() => {
        req.body = dto;
        next();
      })
      .catch((errors: ValidationError[]) => {
        const message = errors.map((error: ValidationError) => Object.values(error.constraints)).join(', ');
        // For validation errors, we keep the detailed message in English and provide a generic Arabic message
        // since validation constraints are typically defined in English
        const messageAr = 'خطأ في التحقق من صحة البيانات المدخلة';
        next(new HttpException(400, message, messageAr));
      });
  };
};
