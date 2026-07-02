import { DoctorAccountStatus, NurseAccountStatus, PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcrypt';
import { Service } from 'typedi';
import { AddUserFromAdminDto, DoctorFromAdminResponseDto, NurseFromAdminResponseDto } from '@/dtos/admins.dto';
import { HttpException } from '@/exceptions/HttpException';
import { ErrorMessages, createBilingualError } from '@/utils/errorMessages';
import { User } from '@/interfaces';
import { SENDER_EMAIL } from '@/config';
import { transporter } from '@/utils/nodeMailerService';
import { ClinicResponseDto } from '@/dtos/clinics.dto';

// TO BE CHANGED
const prisma = new PrismaClient();

@Service()
export class AdminService {
    public async addDoctor(doctorData: AddUserFromAdminDto): Promise<DoctorFromAdminResponseDto> {
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
                date_of_birth: new Date(doctorData.date_of_birth),
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
                specialization: "IMMUNOLOGY", // This is now the KEY (e.g., "IMMUNOLOGY")
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

    public async addNurse(nurseData: AddUserFromAdminDto): Promise<NurseFromAdminResponseDto> {
        const existingUser = await prisma.user.findUnique({
            where: { 
                email: nurseData.email 
            }
        });

        if (existingUser) {
            const error = createBilingualError(409, ErrorMessages.EMAIL_EXISTS);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const username = nurseData.email.split('@')[0];

        const existingUsername = await prisma.user.findUnique({
            where: { 
                username 
            }
        });

        if (existingUsername) {
            const error = createBilingualError(409, ErrorMessages.USERNAME_EXISTS);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const defaultPassword = 'nurse123'; 
        const hashedPassword = await hash(defaultPassword, 10);

        const createdUser = await prisma.user.create({
            data: {
                email: nurseData.email,
                name: nurseData.name,
                username,
                phone: nurseData.phone,
                gender: nurseData.gender,
                date_of_birth: new Date(nurseData.date_of_birth),
                password_hash: hashedPassword,
                role: Role.NURSE,
                isVerified: true,
                hasCompletedProfile: false,
            },
        });

        await prisma.nurse.create({
            data: {
                id: createdUser.id,
                years_of_experience: nurseData.years_of_experience,
                account_status: NurseAccountStatus.APPROVED,
            }
        });
        const createdNurse = await prisma.user.findUnique({
            where: { 
                id: createdUser.id 
            },
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
                nurse: {
                    select: {
                        years_of_experience: true,
                    }
                },
            }
        });

        return createdNurse;

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
                        account_status: true,
                        fellowshipCertificateUrl: true,
                        graduationCertificateUrl: true,
                        mastersCertificateUrl: true,
                        membershipCardUrl: true,
                        unionSpecializationCertificateUrl: true,
                        professionalPracticeCardUrl: true,
                    }
                },
            }
        });

        return doctors;

    }

    public async getAllNurses(): Promise<NurseFromAdminResponseDto[]> {
        const nurses = await prisma.user.findMany({
            where: { 
                role: Role.NURSE 
            },
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
                nurse: {
                    select: {
                        account_status: true,
                        years_of_experience: true,
                        brief: true,
                        nationalCardUrl: true,
                        bonusFileUrl: true,
                    }
                },
            }
        });

        return nurses;

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
                        account_status: true,
                        fellowshipCertificateUrl: true,
                        graduationCertificateUrl: true,
                        mastersCertificateUrl: true,
                        membershipCardUrl: true,
                        unionSpecializationCertificateUrl: true,
                        professionalPracticeCardUrl: true,
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

    public async getNurseById(id: string): Promise<NurseFromAdminResponseDto> {
        const nurse = await prisma.user.findUnique({
            where: { id, role: Role.NURSE },
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
                nurse: {
                    select: {
                        account_status: true,
                        years_of_experience: true,
                        brief: true,
                        nationalCardUrl: true,
                        bonusFileUrl: true,
                    }
                },
            }
        });

        if (!nurse) {
            const error = createBilingualError(404, ErrorMessages.USER_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        return nurse;
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
                        account_status: true,
                        fellowshipCertificateUrl: true,
                        graduationCertificateUrl: true,
                        mastersCertificateUrl: true,
                        membershipCardUrl: true,
                        unionSpecializationCertificateUrl: true,
                        professionalPracticeCardUrl: true,
                    }
                },
            },
        });
        return unverifiedDoctors

    }

    public async getUnverifiedNurses(): Promise<NurseFromAdminResponseDto[]> {

        const unverifiedNurses = await prisma.user.findMany({
            where: {
                role: Role.NURSE,
                nurse: { 
                    account_status: NurseAccountStatus.PENDING 
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                phone: true,
                gender: true,
                date_of_birth: true,
                isVerified: true,
                hasCompletedProfile: true,
                photo_url: true,
                nurse: {
                    select: {
                        account_status: true,
                        years_of_experience: true,
                        brief: true,
                        nationalCardUrl: true,
                        bonusFileUrl: true,
                    }
                },
            },
        });
        return unverifiedNurses

    }

    public async updateDoctorVerificationStatus(doctorId: string, isApproved: boolean | null): Promise<void> {

        const doctor = await prisma.user.findUnique({
            where: { id: doctorId, role: Role.DOCTOR },
        });
        if (!doctor) {
            const error = createBilingualError(404, ErrorMessages.USER_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        let accountStatus: DoctorAccountStatus;
        if (isApproved === true) {
            accountStatus = DoctorAccountStatus.APPROVED;
        } else if (isApproved === false) {
            accountStatus = DoctorAccountStatus.REJECTED;
        } else {
            accountStatus = DoctorAccountStatus.PENDING;
        }

        await prisma.user.update({
            where: { id: doctorId },
            data: {
                doctor: {
                    update: {
                        account_status: accountStatus,
                    }
                }
            }
        });
    }

    public async sendVerificationStatusEmail(userId: string, isApproved: boolean): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true }
        });
        if (!user) {
            const error = createBilingualError(404, ErrorMessages.USER_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        const mailOptions = {
            from: SENDER_EMAIL,
            to: user.email,
            subject: isApproved ? 'User Account Approved - HoloCura' : 'User Account Rejected - HoloCura',
            html: `
                <p>Dear ${user.name},</p>
                <p>Your account has been ${isApproved ? 'approved' : 'rejected'}.</p>
                <p>Thank you for using our platform.</p>
                <p>Best regards,<br/>HoloCura Team</p>
            `
        };

        await transporter.sendMail(mailOptions);
    }

    public async updateNurseVerificationStatus(nurseId: string, isApproved: boolean | null): Promise<void> {

        const nurse = await prisma.user.findUnique({
            where: { id: nurseId, role: Role.NURSE },
        });
        if (!nurse) {
            const error = createBilingualError(404, ErrorMessages.USER_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        let accountStatus: NurseAccountStatus;
        if (isApproved === true) {
            accountStatus = NurseAccountStatus.APPROVED;
        } else if (isApproved === false) {
            accountStatus = NurseAccountStatus.REJECTED;
        } else {
            accountStatus = NurseAccountStatus.PENDING;
        }

        await prisma.user.update({
            where: { id: nurseId },
            data: {
                nurse: {
                    update: {
                        account_status: accountStatus,
                    }
                }
            }
        });
    }
}