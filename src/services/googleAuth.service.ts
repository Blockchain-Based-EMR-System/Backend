import { CreateGoogleUsersDto } from "@/dtos/googleUsers.dto";
import { User, UserLoginData } from "@/interfaces";
import { PrismaClient } from "@prisma/client";
import { Service } from "typedi";
import { HttpException } from "@/exceptions/HttpException";
import { ErrorMessages, createBilingualError } from "@/utils/errorMessages";
import prisma from "@/config/prisma";


@Service()
export class GoogleAuthService {

    public async createInitialProfileGoogle(newUserData: CreateGoogleUsersDto): Promise<User> {
        const username = newUserData.email.split('@')[0];
        const createdUser: User = await prisma.user.create({
            data: {
                email: newUserData.email,
                name: newUserData.name,
                isVerified: newUserData.isEmailVerified,
                username,
                phone: '',
                gender: "MALE",
                date_of_birth: new Date('2000-01-01'),
                password_hash: '',
            },
        });
        await prisma.patient.create({
            data: {
                id: createdUser.id,
                bc_address: '',
                consent: false,
            }
        });
        return createdUser;
    }

    public async updatePhoneNumber(userId: string, phone: string): Promise<void> {
        await prisma.user.update({
            where: { id: userId },
            data: { phone },
        });
    }

    public async getGoogleUserData(userId: string): Promise<UserLoginData> {
        const user: UserLoginData | null = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                email: true,
                name: true,
                username: true,
                phone: true,
                gender: true,
                date_of_birth: true,
                isVerified: true,
                hasCompletedProfile: true,
            }
        });
        if (!user) {
            const err = createBilingualError(404, ErrorMessages.USER_NOT_FOUND);
            throw new HttpException(err.status, err.message, err.messageAr);
        }
        return user;
    }
}