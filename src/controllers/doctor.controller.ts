
import { DoctorSignupRequestDto } from "@/dtos/doctors.dto";
import { RequestWithLanguage } from "@/middlewares/language.middleware";
import { DoctorService } from "@/services/doctor.service";
import { NextFunction, Request, Response } from "express";
import { Container } from "typedi";


export class DoctorController {
    public doctorService = Container.get(DoctorService);

    public doctorSignup = async (req: RequestWithLanguage, res: Response, next: NextFunction) => {
        const doctorData: DoctorSignupRequestDto = req.body;
        await this.doctorService.signup(doctorData);
        res.status(201).json({ message: 'Doctor signed up successfully' });
    };
}