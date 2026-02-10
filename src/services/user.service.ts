import cloudinary from "@/utils/cloudinary";
import { PrismaClient } from "@prisma/client";
import { Service } from "typedi";
import fs from "fs";
import { createBilingualError, ErrorMessages } from "@/utils/errorMessages";
import { HttpException } from "@/exceptions/HttpException";

const prisma = new PrismaClient();

@Service()
export class UserService {

    public async updateProfilePicture(userId: string, localFilePath: string, userRole: string): Promise<void> {

        const oldProfilePictureId = await prisma.user.findUnique({
            where: { id: userId },
            select: { photo_public_id: true }
        });

        if (oldProfilePictureId?.photo_public_id) {
            // Delete old profile picture from Cloudinary
            await cloudinary.uploader.destroy(oldProfilePictureId.photo_public_id);
        }

        // Upload new profile picture to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(localFilePath, {
            folder: `${userRole}S/profile_pictures`,
            overwrite: false,
            public_id: `${userRole}_${userId}_profile_picture_${Date.now()}`
        });

        fs.unlinkSync(localFilePath); // Remove local file after upload

        // Update user record with new profile picture info
        await prisma.user.update({
            where: { id: userId },
            data: {
                photo_url: uploadResult.secure_url,
                photo_public_id: uploadResult.public_id
            }
        });
    }

    public async getProfilePicture(userId: string): Promise<string | null> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { photo_url: true }
        });
        if (!user) {
            const error = createBilingualError(404, ErrorMessages.USER_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        return user?.photo_url || null;
    }

    public async deleteProfilePicture(userId: string): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { photo_public_id: true }
        });
        if (!user) {
            const error = createBilingualError(404, ErrorMessages.USER_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        if (user.photo_public_id) {
            // Delete profile picture from Cloudinary
            await cloudinary.uploader.destroy(user.photo_public_id);
            // Update user record to remove photo info
            await prisma.user.update({
                where: { id: userId },
                data: {
                    photo_url: null,
                    photo_public_id: null
                }
            });
        }
    }

    public async calculateUserAge(dateOfBirth: Date): Promise<number> {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
}