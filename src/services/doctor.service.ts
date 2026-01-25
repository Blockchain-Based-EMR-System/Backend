import { DoctorLoginRequestDto, DoctorSignupRequestDto } from "@/dtos/doctors.dto";
import { Service } from "typedi";
import { HttpException } from "@/exceptions/HttpException";
import { ErrorMessages, createBilingualError } from "@/utils/errorMessages";
import { DoctorAccountStatus, PrismaClient, Role } from "@prisma/client";
import { hash, compare } from "bcrypt";
import { DoctorLoginData } from "@/interfaces/doctors.interface";
import { AuthService } from "./auth.service";
import { Clinic } from "@/interfaces";

// TO BE CHANGED
const prisma = new PrismaClient();
const authService = new AuthService();

@Service()
export class DoctorService {

    public async signup(doctorData: DoctorSignupRequestDto): Promise<void> {
        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: doctorData.email }
        });

        if (existingUser) {
            const error = createBilingualError(409, ErrorMessages.EMAIL_EXISTS);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        // Generate username from email
        const username = doctorData.email.split('@')[0];

        // Check if username exists
        const existingUsername = await prisma.user.findUnique({
            where: { username }
        });

        if (existingUsername) {
            const error = createBilingualError(409, ErrorMessages.USERNAME_EXISTS);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const hashedPassword = await hash(doctorData.password, 10);

        // Create user with doctor role
        const createdUser = await prisma.user.create({
            data: {
                email: doctorData.email,
                name: doctorData.name,
                username,
                phone: doctorData.phone,
                gender: doctorData.gender,
                date_of_birth: new Date(doctorData.date_of_birth),
                password_hash: hashedPassword,
                role: Role.DOCTOR,
                isVerified: false,
                hasCompletedProfile: true,
            },
        });

        await prisma.doctor.create({
            data: {
                id: createdUser.id,
                specialization: doctorData.specialization,
                account_status: DoctorAccountStatus.PENDING,
            },
        });
    }


    public async login(doctorLoginData: DoctorLoginRequestDto): Promise<{ cookies: string[]; doctorAccountData: DoctorLoginData } | boolean> {

        // Find user by email or username
        const doctorUserData = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: doctorLoginData.emailOrUsername },
                    { username: doctorLoginData.emailOrUsername }
                ]
            },
            select: {
                id: true,
                email: true,
                username: true,
                name: true,
                phone: true,
                gender: true,
                hasCompletedProfile: true,
                password_hash: true,
                doctor: {
                    select: {
                        specialization: true,
                        account_status: true
                    }
                }
            }
        });

        // Check if user exists and password matches
        if (!doctorUserData) {
            const error = createBilingualError(401, ErrorMessages.USER_NOT_FOUND_CREDENTIALS);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const isPasswordMatching = await compare(doctorLoginData.password, doctorUserData.password_hash);

        if (!isPasswordMatching) {
            const error = createBilingualError(401, ErrorMessages.USER_NOT_FOUND_CREDENTIALS);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        if (doctorUserData.doctor?.account_status !== DoctorAccountStatus.APPROVED) {
            const error = createBilingualError(403, ErrorMessages.DOCTOR_ACCOUNT_NOT_APPROVED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        if (!doctorUserData.hasCompletedProfile) {
            return false;
        }

        const doctorAccountData: DoctorLoginData =
        {
            id: doctorUserData.id,
            name: doctorUserData.name,
            email: doctorUserData.email,
            username: doctorUserData.username,
            phone: doctorUserData.phone,
            gender: doctorUserData.gender,
            doctor: {
                specialization: doctorUserData.doctor?.specialization,
                account_status: doctorUserData.doctor?.account_status
            }
        }

        const token = await authService.createTokens(doctorUserData, doctorLoginData.rememberMe);
        const cookies = authService.createCookies(token);

        return { cookies, doctorAccountData };
    }

    public async setPassword(doctorId: string, password: string): Promise<void> {
        const hashedPassword = await hash(password, 10);
        const doctorUserData = await prisma.user.findUnique({
            where: { id: doctorId },
            select: { hasCompletedProfile: true }
        });
        if (!doctorUserData) {
            const error = createBilingualError(404, ErrorMessages.USER_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        if (doctorUserData.hasCompletedProfile) {
            const error = createBilingualError(400, ErrorMessages.DOCTOR_PASSWORD_ALREADY_SET);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        await prisma.user.update({
            where: { id: doctorId },
            data: {
                password_hash: hashedPassword,
                hasCompletedProfile: true
            }
        });
    }

    public async updateDoctorProfilePicture(doctorId: string, photoUrl: string, photoPublicId: string): Promise<void> {
        await prisma.user.update({
            where: { id: doctorId },
            data: {
                photo_url: photoUrl,
                photo_public_id: photoPublicId
            }
        });
    }

}