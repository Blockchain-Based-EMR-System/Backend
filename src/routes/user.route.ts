import { UsersController } from "@/controllers/user.controller";
import { UpdateUserProfileDto } from "@/dtos/users.dto";
import { Routes } from "@/interfaces";
import { AuthMiddleware } from "@/middlewares/auth.middleware";
import {uploadImage} from "@/middlewares/multer.middleware";
import { ValidationMiddleware } from "@/middlewares/validation.middleware";
import { errorWrapper } from "@/utils/errorWrapper";
import { Router } from "express";

export class UsersRoute implements Routes {
    public path = '/users'
    public router = Router();
    public usersController = new UsersController();
    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        // User Profile Picture Routes
        this.router.patch(
            `${this.path}/profile-picture`,
            /*
                #swagger.path = '/users/profile-picture'
                #swagger.tags = ['Users']
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
                        messageEn: 'Profile picture updated successfully',
                        messageAr: "تم تحديث صورة الملف الشخصي بنجاح"
                    }
                }
            */
            AuthMiddleware,
            uploadImage.single('profilePicture'),
            ValidationMiddleware(null, false, false, false, true),
            errorWrapper(this.usersController.updateProfilePicture)
        );
        this.router.get(
            `${this.path}/profile-picture`,
            /*
                #swagger.path = '/users/profile-picture'
                #swagger.tags = ['Users']
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
                        messageEn: 'Profile picture retrieved successfully',
                        messageAr: "تم استرجاع صورة الملف الشخصي بنجاح"
                    }
                }
            */
            AuthMiddleware,
            errorWrapper(this.usersController.getProfilePicture)
        )
        this.router.delete(
            `${this.path}/profile-picture`,
            /*
                #swagger.path = '/users/profile-picture'
                #swagger.tags = ['Users']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
                #swagger.responses[200] = {
                    description: 'Profile picture deleted successfully',
                    schema: {
                        messageEn: 'Profile picture deleted successfully',
                        messageAr: "تم حذف صورة الملف الشخصي بنجاح"
                    }
                }
            */
            AuthMiddleware,
            errorWrapper(this.usersController.deleteProfilePicture)
        );

        this.router.patch(
            `${this.path}/update-profile`,
            /*
                #swagger.path = '/users/update-profile'
                #swagger.tags = ['Users']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
                #swagger.requestBody = {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string', example: 'John Doe' },
                                    phone: { type: 'string', example: '+1234567890' },
                                    gender: { type: 'enum', enum: ['MALE', 'FEMALE'], example: 'MALE' },
                                    dateOfBirth: { type: 'string', format: 'date', example: '1990-01-01' }
                                }
                            }
                        }
                    }
                }
                #swagger.responses[200] = {
                    description: 'Profile updated successfully',
                    schema: {
                        messageEn: 'Profile updated successfully',
                        messageAr: "تم تحديث الملف الشخصي بنجاح"
                    }
                }
            */
            AuthMiddleware,
            ValidationMiddleware(UpdateUserProfileDto, false, false, true),
            errorWrapper(this.usersController.updateUserProfile)
        );
    }
}                                    