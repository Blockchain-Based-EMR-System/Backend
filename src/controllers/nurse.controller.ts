import { Request, Response, NextFunction } from "express";
import { RequestWithUser } from "@/interfaces";
import { HttpException } from "@/exceptions/HttpException";
import { catchAsync } from '@/utils/catchAsync';
import { NurseService } from "@/services/nurse.service";
import Container from "typedi";
import { NurseSignupRequestDto, NurseLoginRequestDto, NurseSetPasswordRequestDto} from "@/dtos/nurses.dto";
import { createBilingualError, ErrorMessages } from '@/utils/errorMessages';
import { SuccessResponseMessages, createMultiLangMessage } from '@/utils/responseMessages';


export class NurseController {
    private nurseService = Container.get(NurseService);

    public nurseSignup = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const nurseData: NurseSignupRequestDto = req.body;
        const nurseFiles = req.files as Express.Multer.File[];
        await this.nurseService.nurseSignup(nurseData, nurseFiles);
        const responseMessage = createMultiLangMessage(SuccessResponseMessages.NURSE_CREATED_WAITING_VERIFICATION);
        res.status(201).json({ messageEn: responseMessage.messageEn, messageAr: responseMessage.messageAr });
    });

    public nurseLogin = async (req: Request, res: Response, next: NextFunction) => {
        const nurseLoginData: NurseLoginRequestDto = req.body;
        const loginResult = await this.nurseService.nurseLogin(nurseLoginData);

        if (loginResult === false) {
            res.redirect('/test')
        } else if (typeof loginResult === 'object') {
            const { cookies, NurseAccountData } = loginResult;
            res.setHeader('Set-Cookie', cookies);
            const responseMessage = createMultiLangMessage(SuccessResponseMessages.NURSE_RETRIEVED);
            res.status(200).json({
                data: NurseAccountData,
                messageEn: responseMessage.messageEn,
                messageAr: responseMessage.messageAr
            });
        }
    }

    public nurseSetPassword = catchAsync(async (req: RequestWithUser, res: Response, next: NextFunction) => {
        const nurseId = req.user?.id;
        const { password }: NurseSetPasswordRequestDto = req.body;
        await this.nurseService.nurseSetPassword(nurseId, password);
        const responseMessage = createMultiLangMessage(SuccessResponseMessages.PASSWORD_SET_SUCCESSFULLY_BY_NURSE);
        res.status(200).json({ messageEn: responseMessage.messageEn, messageAr: responseMessage.messageAr });
    });

    public getAllAnnouncements = catchAsync(async (req: RequestWithUser, res: Response, next: NextFunction) => {
        const nurseId = req.user?.id;
        if (!nurseId) {
            const error = createBilingualError(400, ErrorMessages.NURSE_ID_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        const announcements = await this.nurseService.getAllAnnouncements(nurseId);
        const responseMessage = createMultiLangMessage(SuccessResponseMessages.ANNOUNCEMENTS_RETRIEVED);
        res.status(200).json({ data: announcements, messageEn: responseMessage.messageEn, messageAr: responseMessage.messageAr });
    });

}