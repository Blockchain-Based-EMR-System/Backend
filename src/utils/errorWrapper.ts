import { NextFunction, Request, Response } from 'express';

/**
 * Wraps async route handlers to catch errors and pass them to the error middleware
 * @param fn - The async function to wrap
 * @returns A wrapped function that catches errors
 */
export const errorWrapper = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
