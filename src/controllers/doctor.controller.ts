
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

}