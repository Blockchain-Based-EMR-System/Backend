
import { DoctorLoginRequestDto, DoctorSetPasswordRequestDto, DoctorSignupRequestDto } from "@/dtos/doctors.dto";
import { HttpException } from "@/exceptions/HttpException";
import { RequestWithUser } from "@/interfaces";
import { DoctorService } from "@/services/doctor.service";
import { UserService } from "@/services/user.service";
import { createBilingualError, ErrorMessages } from "@/utils/errorMessages";
import { NextFunction, Request, Response } from "express";
import { Container } from "typedi";


export class DoctorController {
    public doctorService = Container.get(DoctorService);
    public userService = Container.get(UserService);

    public doctorSignup = async (req: Request, res: Response, next: NextFunction) => {
        const doctorData: DoctorSignupRequestDto = req.body;
        await this.doctorService.signup(doctorData);
        res.status(201).json({ message: 'Doctor signed up successfully' });
    };

    public doctorLogin = async (req: Request, res: Response, next: NextFunction) => {
        const doctorLoginData: DoctorLoginRequestDto = req.body;
        const loginResult = await this.doctorService.login(doctorLoginData);

        if (loginResult === false) {
            // For testing purposes only - To Be CHANGED according to Frontend Link
            res.redirect('/test')
        } else if (typeof loginResult === 'object') {
            const { cookies, doctorAccountData } = loginResult;
            res.setHeader('Set-Cookie', cookies);
            res.status(200).json({ data: doctorAccountData, message: 'Doctor logged in successfully' });
        }
    }

    public doctorSetPassword = async (req: RequestWithUser, res: Response, next: NextFunction) => {
        const doctorId = req.user?.id;
        const { password }: DoctorSetPasswordRequestDto = req.body;
        await this.doctorService.setPassword(doctorId, password);
        res.status(200).json({ message: 'Password set successfully' });
    }

    public updateProfilePicture = async (req: RequestWithUser, res: Response, next: NextFunction) => {
        const doctorId = req.user?.id;
        const profilePictureFile = req.file;

        if (!profilePictureFile) {
            const error = createBilingualError(400, ErrorMessages.NO_FILE_UPLOADED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        const uploadResult = await this.userService.updateProfilePicture(doctorId, profilePictureFile.path);

        await this.doctorService.updateDoctorProfilePicture(doctorId, uploadResult.url, uploadResult.publicId);

        res.status(200).json({ message: 'Profile picture updated successfully' });

    }

    public getProfilePicture = async (req: RequestWithUser, res: Response, next: NextFunction) => {
        const doctorId = req.user?.id;
        const profilePictureUrl = await this.userService.getUserProfilePicture(doctorId);
        if (!profilePictureUrl) {
            const error = createBilingualError(404, ErrorMessages.NO_PROFILE_PICTURE);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        res.status(200).json({ data: { url: profilePictureUrl }, message: 'Profile picture retrieved successfully' });
    }

    public deleteProfilePicture = async (req: RequestWithUser, res: Response, next: NextFunction) => {
        const doctorId = req.user?.id;
        await this.userService.deleteProfilePicture(doctorId);
        res.status(200).json({ message: 'Profile picture deleted successfully' });
    }
}