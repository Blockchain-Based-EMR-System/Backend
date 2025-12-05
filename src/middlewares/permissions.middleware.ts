import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { HttpException } from '@/exceptions/HttpException';


const prisma = new PrismaClient();

// check if user owns MR

// check if user can view MR