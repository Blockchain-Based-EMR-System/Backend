import { DoctorController } from "@/controllers/doctor.controller";
import { DoctorLoginRequestDto, DoctorProfilePictureRequestDto, DoctorSetPasswordRequestDto, DoctorSignupRequestDto } from "@/dtos/doctors.dto";
import { Routes } from "@/interfaces";
import { ValidationMiddleware } from "@/middlewares/validation.middleware";
import { Router } from "express";
import { errorWrapper } from "@/utils/errorWrapper";
import { AuthMiddleware, RoleMiddleware } from "@/middlewares/auth.middleware";
import upload from "@/middlewares/multer.middleware";
import { Role } from "@prisma/client";


export class DoctorsRoute implements Routes {
    public path = '/doctors'
    public router = Router();
    public doctorsController = new DoctorController();
    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {

        // Doctor Signup Route
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

        // Doctor Login Route
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

        // Doctor Set Password Route
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
            RoleMiddleware(Role.DOCTOR),
            errorWrapper(this.doctorsController.doctorSetPassword)
        );

        // Doctor Profile Picture Routes
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
            RoleMiddleware(Role.DOCTOR),
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
            RoleMiddleware(Role.DOCTOR),
            errorWrapper(this.doctorsController.deleteProfilePicture)
        );

        // Doctor's Clinic Routes
        this.router.get(
            `${this.path}/clinics`,
            /* 
                #swagger.path = '/doctors/clinics'
                #swagger.method = 'get'
                #swagger.tags = ['Doctors']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
                #swagger.responses[200] = {
                    description: 'Get doctor clinics successful',
                    schema: {
                        data: [
                            {
                                id: 'clinic-uuid',
                                name: 'Clinic Name',
                                address: '123 Main St, City, Country',
                                address_maps_link: 'https://maps.google.com/?q=123+Main+St,+City,+Country',
                                phone: '1234567890',
                                opening_at: '09:00',
                                closing_at: '17:00',
                                canPayOnline: true,
                                is_active: true,
                                created_at: '2024-01-01T00:00:00.000Z',
                                fees: 100
                            }
                        ],
                        message: "Doctor's clinics retrieved successfully"
                    }
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.DOCTOR),
            errorWrapper(this.doctorsController.getDoctorClinics)
        );
    }
}