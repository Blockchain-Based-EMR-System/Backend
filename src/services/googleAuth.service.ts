import { CreateGoogleUsersDto } from "@/dtos/googleUsers.dto";
import { User } from "@/interfaces";
import { PrismaClient } from "@prisma/client";
import { Service } from "typedi";
import { HttpException } from "@/exceptions/HttpException";
import { ErrorMessages, createBilingualError } from "@/utils/errorMessages";

const prisma = new PrismaClient();

@Service()
export class GoogleAuthService {

    public async createInitialProfileGoogle(newUserData: CreateGoogleUsersDto): Promise<User> {
        try {
            const username = newUserData.email.split('@')[0];
            const createdUser: User = await prisma.user.create({
                data: {
                    email: newUserData.email,
                    name: newUserData.name,
                    username,
                    phone: '',
                    gender: "MALE",
                    date_of_birth: new Date('2000-01-01'),
                    password_hash: '',
                },
            });
            return createdUser;
        } catch (error) {
            console.error("Error creating initial Google user profile:", error);
            const err = createBilingualError(500, ErrorMessages.SOMETHING_WENT_WRONG);
            throw new HttpException(err.status, err.message, err.messageAr);
        }
    }

    public async updatePhoneNumber(userId: string, phone: string): Promise<void> {
        try {
            await prisma.user.update({
                where: { id: userId },
                data: { phone },
            });
        } catch (error) {
            console.error("Error updating phone number:", error);
            const err = createBilingualError(500, ErrorMessages.SOMETHING_WENT_WRONG);
            throw new HttpException(err.status, err.message, err.messageAr);
        }
    }
}