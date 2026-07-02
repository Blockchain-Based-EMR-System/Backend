import { NextFunction, Request, Response } from 'express';
import { HttpException } from '@exceptions/HttpException';
import { logger } from '@utils/logger';

function mapGrpcCodeToHttp(code: number): number {
  switch (code) {
    case 0: // OK
      return 200;
    case 1: // CANCELLED
      return 499;
    case 3: // INVALID_ARGUMENT
      return 400;
    case 4: // DEADLINE_EXCEEDED
      return 504;
    case 5: // NOT_FOUND
      return 404;
    case 6: // ALREADY_EXISTS
      return 409;
    case 7: // PERMISSION_DENIED
      return 403;
    case 8: // RESOURCE_EXHAUSTED
      return 429;
    case 9: // FAILED_PRECONDITION
      return 412;
    case 10: // ABORTED
      return 409;
    case 11: // OUT_OF_RANGE
      return 400;
    case 12: // UNIMPLEMENTED
      return 501;
    case 13: // INTERNAL
      return 500;
    case 14: // UNAVAILABLE
      return 503;
    case 15: // DATA_LOSS
      return 500;
    case 16: // UNAUTHENTICATED
      return 401;
    default:
      return 500;
  }
}

export const ErrorMiddleware = (error: any, req: Request, res: Response, next: NextFunction) => {
  try {
    let status = 500;
    let message = 'Something went wrong';
    let messageAr = 'حدث خطأ ما';

    // Preserve HttpException
    if (error instanceof HttpException) {
      status = error.status || 500;
      message = error.message || message;
      messageAr = error.messageAr || messageAr;
    } else {
      // Generic Error handling: try to map gRPC/Fabric errors to HTTP codes
      message = error?.message || String(error);

      // Prefer numeric code property if available
      let grpcCode: number | null = null;
      if (typeof error?.code === 'number') grpcCode = error.code;
      else if (typeof error?.status === 'number') grpcCode = error.status;

      // Try to parse numeric code from message like "status code 10" or "code: 9" or leading "9 FAILED_PRECONDITION"
      if (grpcCode === null) {
        const m1 = /status code\s*[:=]?\s*(\d+)/i.exec(message);
        const m2 = /code\s*[:=]?\s*(\d+)/i.exec(message);
        const m3 = /^\s*(\d+)\s+[A-Z_]+/i.exec(message);
        const m = m1 || m2 || m3;
        if (m) {
          const parsed = parseInt(m[1], 10);
          if (!isNaN(parsed)) grpcCode = parsed;
        }
      }

      if (grpcCode !== null) {
        status = mapGrpcCodeToHttp(grpcCode);
      } else {
        // Fallback mapping from tokens
        const t = (message || '').toUpperCase();
        if (t.includes('UNAUTHENTICATED')) status = 401;
        else if (t.includes('PERMISSION_DENIED')) status = 403;
        else if (t.includes('ENDORSEMENT_POLICY') || t.includes('FAILED_PRECONDITION')) status = 412;
        else if (t.includes('NOT_FOUND')) status = 404;
        else if (t.includes('ALREADY_EXISTS')) status = 409;
        else if (t.includes('INVALID_ARGUMENT')) status = 400;
        else status = 500;
      }
    }

    logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}`);
    res.status(status).json({
      messageEn: message,
      messageAr,
    });
  } catch (err) {
    next(err);
  }
};
