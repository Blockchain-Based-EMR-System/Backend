import { PrismaClient } from '@prisma/client';
import { HttpException } from '@/exceptions/HttpException';
import { CreateMedicalRecordDto } from '@/dtos/medical-records.dto';
import { uploadFile, getFile } from '@/services/ipfs.service';

const prisma = new PrismaClient();

// create a new  MR
// upload to IPFS --> get cid --> store on blockchain --> save to db

// get all medical records for a specific patient

// get a specific MR by id?? 

// delete any MR

// get MR shared with a doctor 

// handle permissions --> fabric stuff 