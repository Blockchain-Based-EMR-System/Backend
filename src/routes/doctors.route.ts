import { DoctorController } from "@/controllers/doctor.controller";
import { DoctorLoginRequestDto, DoctorSignupRequestDto } from "@/dtos/doctors.dto";
import { Routes } from "@/interfaces";
import { ValidationMiddleware } from "@/middlewares/validation.middleware";
import { Router } from "express";
import { errorWrapper } from "@/utils/errorWrapper";


export class DoctorsRoute implements Routes {
    public path = '/doctors'
    public router = Router();
    public doctorsController = new DoctorController();
    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(
            `/doctors/signup`,
            /* 
                #swagger.tags = ['Doctors']
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Doctor signup data',
                    required: true,
                    schema: {
                        $email: 'doctor@example.com',
                        $name: 'Dr. Smith',
                        $phone: '1234567890',
                        $password: 'SecurePassword123',
                        $gender: 'MALE or FEMALE',
                        date_of_birth: '1990-01-01',
                        $specialization: 'CARDIOLOGY or امراض القلب or Cardiology'
                    }
                }
                #swagger.responses[201] = {
                    description: 'Doctor signup successful',
                    schema: {
                        message: 'Doctor registered successfully'
                    }
                }
            */
            ValidationMiddleware(DoctorSignupRequestDto),
            errorWrapper(this.doctorsController.doctorSignup)
        );

        this.router.post(
            `/doctors/login`,
            /* 
                #swagger.tags = ['Doctors']
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Doctor login data',
                    required: true,
                    schema: {
                        $emailOrUsername: 'doctor@example.com',
                        $password: 'SecurePassword123',
                        $rememberMe: "true"
                    }
                }
                #swagger.responses[200] = {
                    description: 'Doctor login successful',
                    schema: {
                        data: {
                            id: 1,
                            email: 'test@example.com',
                            name: 'Dr. Smith',
                            username: 'drsmith',
                            phone: '1234567890',
                            gender: 'MALE',
                            doctor: {
                                specialization: 'CARDIOLOGY',
                                account_status: 'APPROVED'
                            }
                        },
                        message: 'Doctor logged in successfully'
                    }
                }
            */
            ValidationMiddleware(DoctorLoginRequestDto),
            errorWrapper(this.doctorsController.doctorLogin)
        );
    }
}