import { AddAdminFromSuperAdminDto } from "@/dtos/superAdmins.dto";
import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcrypt";
import { Service } from "typedi";

const prisma = new PrismaClient();

@Service()
export class SuperAdminService {

    public async addAdmin(adminData: AddAdminFromSuperAdminDto): Promise<any> {
        // Logic to add a new admin
        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: adminData.email }
        });
        if (existingUser) {
            throw new Error('Email already exists');
        }
        const username = adminData.email.split('@')[0];

        // Check if username exists
        const existingUsername = await prisma.user.findUnique({
            where: { username }
        });
        if (existingUsername) {
            throw new Error('Username already exists');
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
            }
        });
        return newAdmin;
    }
}