
import { DoctorLoginRequestDto, DoctorSetPasswordRequestDto, DoctorSignupRequestDto, PostAnnouncementDto } from "@/dtos/doctors.dto";
import { RequestWithUser } from "@/interfaces";
import { DoctorService } from "@/services/doctor.service";
import { UserService } from "@/services/user.service";
import { HttpException } from "@/exceptions/HttpException";
import { createMultiLangMessage, SuccessResponseMessages } from "@/utils/responseMessages";
import { NextFunction, Request, Response } from "express";
import { Container } from "typedi";
import { createBilingualError, ErrorMessages } from "@/utils/errorMessages";


export class DoctorController {
    public doctorService = Container.get(DoctorService);
    public userService = Container.get(UserService);

    public doctorSignup = async (req: Request, res: Response, next: NextFunction) => {
        const doctorData: DoctorSignupRequestDto = req.body;
        const doctorFiles = req.files as Express.Multer.File[];
        await this.doctorService.signup(doctorData, doctorFiles);
        const responseMessage = createMultiLangMessage(SuccessResponseMessages.DOCTOR_CREATED_WAITING_VERIFICATION);
        res.status(201).json({ messageEn: responseMessage.messageEn, messageAr: responseMessage.messageAr });
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
            const responseMessage = createMultiLangMessage(SuccessResponseMessages.DOCTOR_RETRIEVED);
            res.status(200).json({
                data: doctorAccountData,
                messageEn: responseMessage.messageEn,
                messageAr: responseMessage.messageAr
            });
        }
    }

    public doctorSetPassword = async (req: RequestWithUser, res: Response, next: NextFunction) => {
        const doctorId = req.user?.id;
        const { password }: DoctorSetPasswordRequestDto = req.body;
        await this.doctorService.setPassword(doctorId, password);
        const responseMessage = createMultiLangMessage(SuccessResponseMessages.PASSWORD_SET_SUCCESSFULLY_BY_DOCTOR);
        res.status(200).json({ messageEn: responseMessage.messageEn, messageAr: responseMessage.messageAr });
    }

    public getDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { gender, minFees, maxFees, isOnline, lang } = req.query;

        if (!lang || (lang !== 'en' && lang !== 'ar')) {
            const error = createBilingualError(400, ErrorMessages.SPECIALIZATION_LANG);
            throw new HttpException(400, error.message, error.messageAr);
        }

        const finalIsOnline = isOnline !== undefined ? isOnline === 'true' : undefined;
        const finalGender = gender as string | undefined;

        const finalMinFees = minFees && typeof minFees === 'string' ? parseFloat(minFees) : undefined;
        const finalMaxFees = maxFees && typeof maxFees === 'string' ? parseFloat(maxFees) : undefined;

        if (finalMinFees > finalMaxFees) {
            const error = createBilingualError(404, ErrorMessages.INVALID_FEES_RANGE);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const doctors = await this.doctorService.getDoctors(lang as 'en' | 'ar', finalGender, finalMinFees, finalMaxFees, finalIsOnline);

        const response = createMultiLangMessage(SuccessResponseMessages.DOCTORS_RETRIEVED_SUCCESSFULLY);
        res.status(200).json({
            data: doctors,
            ...response
        });
    }

    public postAnnouncement = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
        const doctorId = req.user?.id;
        const announcementData: PostAnnouncementDto = req.body;

        await this.doctorService.postAnnouncement(doctorId, announcementData);

        const responseMessage = createMultiLangMessage(SuccessResponseMessages.ANNOUNCEMENT_CREATED_SUCCESSFULLY);
        res.status(201).json({ messageEn: responseMessage.messageEn, messageAr: responseMessage.messageAr });
    }

    public getDoctorAnnouncements = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
        const doctorId = req.user?.id;
        const announcements = await this.doctorService.getDoctorAnnouncements(doctorId);

        const responseMessage = createMultiLangMessage(SuccessResponseMessages.ANNOUNCEMENTS_RETRIEVED_SUCCESSFULLY);
        res.status(200).json({
            data: announcements,
            ...responseMessage
        });
    }

    public getAnnouncementApplicants = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
        const doctorId = req.user?.id;
        const { announcementId } = req.params;
        const applicants = await this.doctorService.getAnnouncementApplicants(doctorId, announcementId);

        const responseMessage = createMultiLangMessage(SuccessResponseMessages.APPLICANTS_RETRIEVED_SUCCESSFULLY);
        res.status(200).json({
            data: applicants,
            ...responseMessage
        });
    }
}