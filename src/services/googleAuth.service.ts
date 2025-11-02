import { CreateGoogleUsersDto } from "@/dtos/googleUsers.dto";
import { User } from "@/interfaces";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createInitialProfileGoogle = async (newUserData: CreateGoogleUsersDto):Promise<User> =>{
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
    }
}
