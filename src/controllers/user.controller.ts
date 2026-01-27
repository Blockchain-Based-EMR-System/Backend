import { HttpException } from "@/exceptions/HttpException";
import { RequestWithUser } from "@/interfaces";
import { UserService } from "@/services/user.service";
import { createBilingualError, ErrorMessages } from "@/utils/errorMessages";
import { NextFunction, Request, Response } from "express";
import { Container } from "typedi";


export class UsersController {
    public userService = Container.get(UserService);

    public updateProfilePicture = async (req: RequestWithUser, res: Response, next: NextFunction) => {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const profilePictureFile = req.file;

        if (!profilePictureFile) {
            const error = createBilingualError(400, ErrorMessages.NO_FILE_UPLOADED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        await this.userService.updateProfilePicture(userId, profilePictureFile.path, userRole);

        res.status(200).json({ message: 'Profile picture updated successfully' });

    }

    public getProfilePicture = async (req: RequestWithUser, res: Response, next: NextFunction) => {
        const userId = req.user?.id;
        const profilePictureUrl = await this.userService.getProfilePicture(userId);
        if (!profilePictureUrl) {
            const error = createBilingualError(404, ErrorMessages.NO_PROFILE_PICTURE);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        res.status(200).json({ data: { url: profilePictureUrl }, message: 'Profile picture retrieved successfully' });
    }

    public deleteProfilePicture = async (req: RequestWithUser, res: Response, next: NextFunction) => {
        const userId = req.user?.id;
        await this.userService.deleteProfilePicture(userId);
        res.status(200).json({ message: 'Profile picture deleted successfully' });
    }
}