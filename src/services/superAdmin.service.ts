import { AddAdminFromSuperAdminDto, AdminFromSuperAdminResponseDto } from "@/dtos/superAdmins.dto";
import { HttpException } from "@/exceptions/HttpException";
import { User } from "@/interfaces";
import { createBilingualError, ErrorMessages } from "@/utils/errorMessages";
import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcrypt";
import { Service } from "typedi";

const prisma = new PrismaClient();

@Service()
export class SuperAdminService {

    public async addAdmin(adminData: AddAdminFromSuperAdminDto): Promise<AdminFromSuperAdminResponseDto> {
        // Logic to add a new admin
        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: adminData.email }
        });
        if (existingUser) {
            const err = createBilingualError(409, ErrorMessages.EMAIL_EXISTS);
            throw new HttpException(err.status, err.message, err.messageAr);
        }
        const username = adminData.email.split('@')[0];

        // Check if username exists
        const existingUsername = await prisma.user.findUnique({
            where: { username }
        });
        if (existingUsername) {
            const err = createBilingualError(409, ErrorMessages.USERNAME_EXISTS);
            throw new HttpException(err.status, err.message, err.messageAr);
        }

        const hashedPassword = await hash(adminData.password, 10);

        const newAdmin = await prisma.user.create({
            data: {
                email: adminData.email,
                name: adminData.name,
                username: username,
                password_hash: hashedPassword,
                role: Role.ADMIN,
                phone: adminData.phone,
                gender: adminData.gender,
                isVerified: true,
                hasCompletedProfile: true,
                date_of_birth: new Date(adminData.date_of_birth),
            },
            select: {
                email: true,
                name: true,
                username: true,
                phone: true,
                role: true,
                gender: true,
                isVerified: true,
                hasCompletedProfile: true,
                date_of_birth: true,
                photo_url: true,
            }
        });
        return newAdmin;
    }

    public async getAllAdmins(): Promise<AdminFromSuperAdminResponseDto[]> {
        const admins = await prisma.user.findMany({
            where: { role: Role.ADMIN },
            select: {
                email: true,
                name: true,
                username: true,
                phone: true,
                role: true,
                gender: true,
                isVerified: true,
                hasCompletedProfile: true,
                date_of_birth: true,
                photo_url: true,
            }
        });
        return admins;
    }

    public async getAdminById(adminId: string): Promise<AdminFromSuperAdminResponseDto | null> {
        const admin = await prisma.user.findUnique({
            where: { id: adminId, role: Role.ADMIN },
            select: {
                email: true,
                name: true,
                username: true,
                phone: true,
                role: true,
                gender: true,
                isVerified: true,
                hasCompletedProfile: true,
                date_of_birth: true,
                photo_url: true,
            }
        });
        return admin;
    }

}