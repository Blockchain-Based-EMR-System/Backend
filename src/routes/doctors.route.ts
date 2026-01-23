import { DoctorController } from "@/controllers/doctor.controller";
import { DoctorLoginRequestDto, DoctorProfilePictureRequestDto, DoctorSetPasswordRequestDto, DoctorSignupRequestDto } from "@/dtos/doctors.dto";
import { Routes } from "@/interfaces";
import { ValidationMiddleware } from "@/middlewares/validation.middleware";
import { Router } from "express";
import { errorWrapper } from "@/utils/errorWrapper";
import { AuthMiddleware } from "@/middlewares/auth.middleware";
import upload from "@/middlewares/multer.middleware";


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
        this.router.patch(
            `/doctors/set-password`,
            /* 
                #swagger.tags = ['Doctors']
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'New password data',
                    required: true,
                    schema: {
                        $password: 'NewSecurePassword123'
                    }
                }
                #swagger.responses[200] = {
                    description: 'Password set successfully',
                    schema: {
                        message: 'Password updated successfully'
                    }
                }
            */
            ValidationMiddleware(DoctorSetPasswordRequestDto),
            AuthMiddleware,
            errorWrapper(this.doctorsController.doctorSetPassword)
        );
        this.router.patch(
            `/doctors/profile-picture`,
            /*
                #swagger.tags = ['Doctors']
                #swagger.consumes = ['multipart/form-data']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['profilePicture'] = {
                    in: 'formData',
                    type: 'file',
                    required: true,
                    description: 'Profile picture file'
                }
                #swagger.responses[200] = {
                    description: 'Profile picture updated successfully',
                    schema: {
                        message: 'Profile picture updated successfully'
                    }
                }
            */
            AuthMiddleware,
            upload.single('profilePicture'),
            ValidationMiddleware(null, false, false, false, true),
            errorWrapper(this.doctorsController.updateProfilePicture)
        );
        this.router.get(
            `/doctors/profile-picture`,
            /*
                #swagger.tags = ['Doctors']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
                #swagger.responses[200] = {
                    description: 'Get profile picture successful',
                    schema: {
                        data: {
                            url: 'https://res.cloudinary.com/your-cloud-name/image/upload/v1696543210/doctors/profile_pictures/doctor_1_profile_picture_1696543210.jpg'
                        },
                        message: 'Profile picture retrieved successfully'
                    }
                }
            */
            AuthMiddleware,
            errorWrapper(this.doctorsController.getProfilePicture)
        )
        this.router.delete(
            `/doctors/profile-picture`,
            /*
                #swagger.tags = ['Doctors']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
                #swagger.responses[200] = {
                    description: 'Profile picture deleted successfully',
                    schema: {
                        message: 'Profile picture deleted successfully'
                    }
                }
            */
            AuthMiddleware,
            errorWrapper(this.doctorsController.deleteProfilePicture)
        );
    }
}