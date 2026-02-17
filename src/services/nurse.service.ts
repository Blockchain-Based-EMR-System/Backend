import { Service } from "typedi";
import { HttpException } from "@/exceptions/HttpException";
import { ErrorMessages, createBilingualError } from "@/utils/errorMessages";
import { hash, compare } from "bcrypt";
import { AuthService } from "./auth.service";
import { NurseSignupRequestDto, NurseLoginRequestDto } from "@/dtos/nurses.dto";
import { NurseLoginData } from "@/interfaces/nurse.interface";
import { NURSE_FILES } from "@/interfaces";
import prisma from '@/config/prisma';
import { Role, NurseAccountStatus } from "@prisma/client";
import cloudinary from "@/utils/cloudinary";
import fs from "fs";

@Service()
export class NurseService {

    private authService = new AuthService();

    public async signup(nurseData: NurseSignupRequestDto, nurseFiles: {}) {
        const existingUser = await prisma.user.findUnique({
            where: { email: nurseData.email }
        });

        if (existingUser) {
            const error = createBilingualError(409, ErrorMessages.EMAIL_EXISTS);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const username = nurseData.email.split('@')[0];

        const existingUsername = await prisma.user.findUnique({
            where: { username }
        });

        if (existingUsername) {
            const error = createBilingualError(409, ErrorMessages.USERNAME_EXISTS);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const hashedPassword = await hash(nurseData.password, 10);

        const createdUserId = await prisma.$transaction(async (tx) => {
            const createdUser = await tx.user.create({
                data: {
                    email: nurseData.email,
                    name: nurseData.name,
                    username,
                    phone: nurseData.phone,
                    gender: nurseData.gender,
                    date_of_birth: new Date(nurseData.date_of_birth),
                    password_hash: hashedPassword,
                    role: Role.NURSE,
                    isVerified: true,
                    hasCompletedProfile: true,
                },
            });

            await tx.nurse.create({
                data: {
                    id: createdUser.id,
                    account_status: NurseAccountStatus.PENDING,
                    years_of_experience: nurseData.years_of_experience,
                    brief: nurseData.brief,
                },
            });
            return createdUser.id;
        });

        if (nurseFiles && Object.keys(nurseFiles).length > 0) {
            const nurseFilesArray = Object.values(nurseFiles).flat() as Express.Multer.File[];

            await this._uploadFiles(nurseFilesArray, createdUserId);
        }
    }

    public async login(nurseLoginData: NurseLoginRequestDto): Promise<{ cookies: string[]; NurseAccountData: NurseLoginData } | boolean> {

        const nurseUserData = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: nurseLoginData.emailOrUsername },
                    { username: nurseLoginData.emailOrUsername }
                ]
            },
            select: {
                id: true,
                email: true,
                username: true,
                name: true,
                phone: true,
                gender: true,
                hasCompletedProfile: true,
                password_hash: true,
                nurse: {
                    select: {
                        account_status: true
                    }
                }
            }
        });

        if (!nurseUserData) {
            const error = createBilingualError(401, ErrorMessages.USER_NOT_FOUND_CREDENTIALS);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const isPasswordMatching = await compare(nurseLoginData.password, nurseUserData.password_hash);

        if (!isPasswordMatching) {
            const error = createBilingualError(401, ErrorMessages.USER_NOT_FOUND_CREDENTIALS);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        if (nurseUserData.nurse?.account_status !== NurseAccountStatus.APPROVED) {
            const error = createBilingualError(403, ErrorMessages.NURSE_ACCOUNT_NOT_APPROVED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        if (!nurseUserData.hasCompletedProfile) {
            return false;
        }

        const NurseAccountData: NurseLoginData =
        {
            id: nurseUserData.id,
            name: nurseUserData.name,
            email: nurseUserData.email,
            username: nurseUserData.username,
            phone: nurseUserData.phone,
            gender: nurseUserData.gender,
            nurse: {
                account_status: nurseUserData.nurse?.account_status
            }
        }

        const token = await this.authService.createTokens(nurseUserData, nurseLoginData.rememberMe);
        const cookies = this.authService.createCookies(token);

        return { cookies, NurseAccountData };
    }

    public async setPassword(nurseId: string, password: string): Promise<void> {
        const hashedPassword = await hash(password, 10);
        const nurseUserData = await prisma.user.findUnique({
            where: { id: nurseId },
            select: { hasCompletedProfile: true }
        });
        if (!nurseUserData) {
            const error = createBilingualError(404, ErrorMessages.USER_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        if (nurseUserData.hasCompletedProfile) {
            const error = createBilingualError(400, ErrorMessages.NURSE_PASSWORD_ALREADY_SET);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        await prisma.user.update({
            where: { id: nurseId },
            data: {
                password_hash: hashedPassword,
                hasCompletedProfile: true
            }
        });
    }


    private async _uploadFiles(files: Express.Multer.File[], nurseId: string): Promise<void> {
        const uploadedFiles: { public_id: string }[] = [];

        try {
            for (const file of files) {
                if (!Object.values(NURSE_FILES).includes(file.fieldname as any)) {
                    const error = createBilingualError(400, ErrorMessages.UNKNOWN_FILE_FIELDNAME);
                    throw new HttpException(error.status, error.message, error.messageAr);
                }
            }

            const uploadResults = await Promise.all(
                files.map(file =>
                    cloudinary.uploader.upload(file.path, {
                        folder: `NURSES/documents/${nurseId}`,
                        overwrite: false,
                        public_id: `NURSE_${nurseId}_${file.fieldname}_${Date.now()}`
                    })
                )
            );

            uploadedFiles.push(...uploadResults.map(r => ({ public_id: r.public_id })));

            const updateData: any = {};
            files.forEach((file, index) => {
                const uploadResult = uploadResults[index];

                switch (file.fieldname) {
                    case NURSE_FILES.NATIONAL_CARD:
                        updateData.nationalCardUrl = uploadResult.secure_url;
                        updateData.nationalCardPublicId = uploadResult.public_id;
                        break;
                    case NURSE_FILES.BONUS_FILE:
                        updateData.bonusFileUrl = uploadResult.secure_url;
                        updateData.bonusFilePublicId = uploadResult.public_id;
                        break;
                }
                fs.unlinkSync(file.path);
            });

            await prisma.nurse.update({
                where: { id: nurseId },
                data: updateData
            });

        } catch (error) {
            if (uploadedFiles.length > 0) {
                await Promise.all(
                    uploadedFiles.map(f => cloudinary.uploader.destroy(f.public_id).catch(() => { }))
                );

            }

            files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
            throw error;
        }
    }
}
