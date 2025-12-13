import { DoctorAccountStatus, PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcrypt';
import { Service } from 'typedi';
import { AddDoctorFromAdminDto, DoctorFromAdminResponseDto } from '@/dtos/admins.dto';
import { HttpException } from '@/exceptions/HttpException';
import { ErrorMessages, createBilingualError } from '@/utils/errorMessages';
import { User } from '@/interfaces';

// TO BE CHANGED
const prisma = new PrismaClient();

@Service()
export class AdminService {
    public async addDoctor(doctorData: AddDoctorFromAdminDto): Promise<DoctorFromAdminResponseDto> {
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

        // Generate default password (doctor can change it later)
        const defaultPassword = 'doctor123'; // Should be changed on first login
        const hashedPassword = await hash(defaultPassword, 10);

        // Create user with doctor role
        const createdUser = await prisma.user.create({
            data: {
                email: doctorData.email,
                name: doctorData.name,
                username,
                phone: doctorData.phone,
                gender: doctorData.gender,
                date_of_birth: new Date('1990-01-01'),
                password_hash: hashedPassword,
                role: Role.DOCTOR,
                isVerified: true,
                hasCompletedProfile: false,
            },
        });

        // Create doctor profile
        await prisma.doctor.create({
            data: {
                id: createdUser.id,
                specialization: doctorData.specialization, // This is now the KEY (e.g., "CARDIOLOGY")
                account_status: DoctorAccountStatus.APPROVED,
            }
        });
        const createdDoctor = await prisma.user.findUnique({
            where: { id: createdUser.id },
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                phone: true,
                gender: true,
                date_of_birth: true,
                role: true,
                isVerified: true,
                hasCompletedProfile: true,
                photo_url: true,
                doctor: {
                    select: {
                        specialization: true,
                    }
                },
            }
        });

        return createdDoctor;

    }

    public async getAllDoctors(): Promise<DoctorFromAdminResponseDto[]> {

        const doctors = await prisma.user.findMany({
            where: { role: Role.DOCTOR },
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                phone: true,
                gender: true,
                date_of_birth: true,
                role: true,
                isVerified: true,
                hasCompletedProfile: true,
                photo_url: true,
                doctor: {
                    select: {
                        specialization: true,
                        avg_time: true,
                        account_status: true
                    }
                },
            }
        });

        return doctors;

    }

    public async getDoctorById(id: string): Promise<DoctorFromAdminResponseDto> {

        const doctor = await prisma.user.findUnique({
            where: { id, role: Role.DOCTOR },
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                phone: true,
                gender: true,
                date_of_birth: true,
                role: true,
                isVerified: true,
                hasCompletedProfile: true,
                photo_url: true,
                doctor: {
                    select: {
                        specialization: true,
                        avg_time: true,
                        account_status: true
                    }
                },
            }
        });

        if (!doctor) {
            const error = createBilingualError(404, ErrorMessages.USER_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        return doctor;
    }

    public async getUnverifiedDoctors(): Promise<DoctorFromAdminResponseDto[]> {

        const unverifiedDoctors = await prisma.user.findMany({
            where: { role: Role.DOCTOR, doctor: { account_status: DoctorAccountStatus.PENDING } },
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                phone: true,
                gender: true,
                date_of_birth: true,
                isVerified: true,
                photo_url: true,
                doctor: {
                    select: {
                        specialization: true,
                        avg_time: true,
                        account_status: true
                    }
                },
            },
        });
        return unverifiedDoctors

    }
    public async updateDoctorVerificationStatus(doctorId: string, isApproved: boolean): Promise<void> {

        const doctor = await prisma.user.findUnique({
            where: { id: doctorId, role: Role.DOCTOR },
        });
        if (!doctor) {
            const error = createBilingualError(404, ErrorMessages.USER_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        await prisma.user.update({
            where: { id: doctorId },
            data: {
                doctor: {
                    update: {
                        account_status: isApproved ? DoctorAccountStatus.APPROVED : DoctorAccountStatus.REJECTED,
                    }
                }
            }
        });
    }
}
