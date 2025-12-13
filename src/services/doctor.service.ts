import { DoctorSignupRequestDto } from "@/dtos/doctors.dto";
import { Service } from "typedi";
import { HttpException } from "@/exceptions/HttpException";
import { ErrorMessages, createBilingualError } from "@/utils/errorMessages";
import { DoctorAccountStatus, PrismaClient, Role } from "@prisma/client";
import { hash } from "bcrypt";

// TO BE CHANGED
const prisma = new PrismaClient();

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

}
