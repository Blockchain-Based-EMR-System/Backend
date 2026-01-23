import cloudinary from "@/utils/cloudinary";
import { PrismaClient } from "@prisma/client";
import { Service } from "typedi";
import fs from "fs";

const prisma = new PrismaClient();

@Service()
export class UserService {

    public async updateProfilePicture(userId: string, localFilePath: string): Promise<{ url: string; publicId: string }> {

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
            folder: 'doctors/profile_pictures',
            overwrite: false,
            public_id: `doctor_${userId}_profile_picture_${Date.now()}`
        });

        fs.unlinkSync(localFilePath); // Remove local file after upload

        return {
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id
        }
    }
}