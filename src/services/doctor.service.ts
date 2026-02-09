import { DoctorLoginRequestDto, DoctorSignupRequestDto } from "@/dtos/doctors.dto";
import { Service } from "typedi";
import { HttpException } from "@/exceptions/HttpException";
import { ErrorMessages, createBilingualError } from "@/utils/errorMessages";
import { Doctor, DoctorAccountStatus, PrismaClient, Role } from "@prisma/client";
import { hash, compare } from "bcrypt";
import { DoctorLoginData, DoctorPersonalData } from "@/interfaces/doctors.interface";
import { AuthService } from "./auth.service";
import prisma from "@/config/prisma";
import cloudinary from "@/utils/cloudinary";
import { DOCTOR_FILES } from "@/interfaces";
import fs from "fs";
import { AvailabilityType, Gender } from "@prisma/client";
import { UserService } from "./user.service";
import { DoctorClinics } from "@/interfaces";


const authService = new AuthService();

@Service()
export class DoctorService {

    private userService = new UserService();

    public async signup(doctorData: DoctorSignupRequestDto, doctorFiles: {}): Promise<void> {
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

        // Create user and doctor in a transaction
        const createdUserId = await prisma.$transaction(async (tx) => {
            const createdUser = await tx.user.create({
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
                    hasCompletedProfile: true,
                },
            });

            await tx.doctor.create({
                data: {
                    id: createdUser.id,
                    specialization: "IMMUNOLOGY",
                    account_status: DoctorAccountStatus.PENDING,
                },
            });
            return createdUser.id;
        });

        // Upload files and update doctor record with files urls        
        if (doctorFiles && Object.keys(doctorFiles).length > 0) {
            const doctorFilesArray = Object.values(doctorFiles).flat() as Express.Multer.File[];

            await this._uploadFiles(doctorFilesArray, createdUserId);
        }
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


    private async _uploadFiles(files: Express.Multer.File[], doctorId: string): Promise<void> {
        const uploadedFiles: { public_id: string }[] = [];

        try {
            // Validate all fieldnames before uploading
            for (const file of files) {
                if (!Object.values(DOCTOR_FILES).includes(file.fieldname as any)) {
                    const error = createBilingualError(400, ErrorMessages.UNKNOWN_FILE_FIELDNAME);
                    throw new HttpException(error.status, error.message, error.messageAr);
                }
            }

            // Upload all files to Cloudinary in parallel
            const uploadResults = await Promise.all(
                files.map(file =>
                    cloudinary.uploader.upload(file.path, {
                        folder: `DOCTORS/documents/${doctorId}`,
                        overwrite: false,
                        public_id: `DOCTOR_${doctorId}_${file.fieldname}_${Date.now()}`
                    })
                )
            );

            // Track uploaded files for potential rollback
            uploadedFiles.push(...uploadResults.map(r => ({ public_id: r.public_id })));

            // Map file fields to database columns
            const updateData: any = {};
            files.forEach((file, index) => {
                const uploadResult = uploadResults[index];

                switch (file.fieldname) {
                    case DOCTOR_FILES.GRADUATION_CERTIFICATE:
                        updateData.graduationCertificateUrl = uploadResult.secure_url;
                        updateData.graduationCertificatePublicId = uploadResult.public_id;
                        break;
                    case DOCTOR_FILES.MEMBERSHIP_CARD:
                        updateData.membershipCardUrl = uploadResult.secure_url;
                        updateData.membershipCardPublicId = uploadResult.public_id;
                        break;
                    case DOCTOR_FILES.PROFESSIONAL_PRACTICE_CARD:
                        updateData.professionalPracticeCardUrl = uploadResult.secure_url;
                        updateData.professionalPracticeCardPublicId = uploadResult.public_id;
                        break;
                    case DOCTOR_FILES.MASTERS_CERTIFICATE:
                        updateData.mastersCertificateUrl = uploadResult.secure_url;
                        updateData.mastersCertificatePublicId = uploadResult.public_id;
                        break;
                    case DOCTOR_FILES.FELLOWSHIP_CERTIFICATE:
                        updateData.fellowshipCertificateUrl = uploadResult.secure_url;
                        updateData.fellowshipCertificatePublicId = uploadResult.public_id;
                        break;
                    case DOCTOR_FILES.UNION_SPECIALIZATION_CERTIFICATE:
                        updateData.unionSpecializationCertificateUrl = uploadResult.secure_url;
                        updateData.unionSpecializationCertificatePublicId = uploadResult.public_id;
                        break;
                }
                console.log(`Deleting ${file.path}`);

                fs.unlinkSync(file.path); // Delete local file after upload
            });

            // Update database with all URLs in a single operation
            await prisma.doctor.update({
                where: { id: doctorId },
                data: updateData
            });

        } catch (error) {
            // Rollback: Delete all uploaded files from Cloudinary
            if (uploadedFiles.length > 0) {
                await Promise.all(
                    uploadedFiles.map(f => cloudinary.uploader.destroy(f.public_id).catch(() => { }))
                );

            }

            // Delete local files in case of error (only if they still exist)
            files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
            throw error;
        }
    }
    public async getOnlineDoctors(): Promise<Partial<Doctor>[]> {
        const doctors = await prisma.doctor.findMany({
            where: {
                account_status: 'APPROVED',
                present: true,
                availability_type: {
                    in: ['ONLINE', 'BOTH']
                }
            },
            select: {
                id: true,
                user: {
                    select: {
                        name: true,
                    }
                }
            }
        });
        return doctors.map(doctor => ({
            id: doctor.id,
            name: doctor.user.name,
        }));
    }

    public async getDoctors(gender?: string, minFees?: number, maxFees?: number, isOnline?: boolean): Promise<DoctorPersonalData[]> {
        const WhereClause: any = {
            is_accepting: true,                  
            doctor: {
                account_status: DoctorAccountStatus.APPROVED,
            }
        };

        if (isOnline !== undefined) {
            WhereClause.doctor = {
                ...(WhereClause.doctor || {}),
                availability_type: isOnline
                    ? { in: [AvailabilityType.ONLINE, AvailabilityType.BOTH] }
                    : { in: [AvailabilityType.OFFLINE, AvailabilityType.BOTH] },
            };
        }

        if (minFees !== undefined || maxFees !== undefined) {
            WhereClause.fees = {};

            if (minFees !== undefined) {
                WhereClause.fees.gte = minFees;
            }
            if (maxFees !== undefined) {
                WhereClause.fees.lte = maxFees;
            }
        }

        if (gender) {
            const normalized = gender.toUpperCase();
            if (normalized === 'MALE' || normalized === 'FEMALE') {
                WhereClause.doctor.user = {
                    gender: normalized as Gender
                };
            }
        }

        const doctorClinics = await prisma.clinicDoctor.findMany({
            where: WhereClause,
            include: {
                doctor: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                gender: true,
                                phone: true,
                                date_of_birth: true,
                            },
                        },
                    },
                },
                clinic: {  
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        canPayOnline: true,
                        opening_at: true,
                        closing_at: true,
                        address: true,
                        address_maps_link: true,
                    },
                },
            },
        });

        const doctorGroupsMap = new Map<string, typeof doctorClinics>();
        for (const docClinic of doctorClinics) {
            const doctorId = docClinic.doctor.user?.id;
            if (!doctorId) continue;

            if (!doctorGroupsMap.has(doctorId)) {
                doctorGroupsMap.set(doctorId, []);
            }
            doctorGroupsMap.get(doctorId)!.push(docClinic);
        }

        const doctorPersonalData: DoctorPersonalData[] = [];

        for (const [doctorId, clinicRecords] of doctorGroupsMap.entries()) {
            const representativeRecord = clinicRecords[0];
            const doctor = representativeRecord.doctor;
            const user = doctor.user;

            if (!user) continue;

            const age = await this.userService.calculateUserAge(user.date_of_birth);
            const allClinics: DoctorClinics[] = [];

            if (!isOnline){
                for (const record of clinicRecords) {
                allClinics.push({
                    id: record.clinic.id,
                    name: record.clinic.name,
                    phone: record.clinic.phone,
                    canPayOnline: record.clinic.canPayOnline,
                    opening_at: record.clinic.opening_at,
                    closing_at: record.clinic.closing_at,
                    address: record.clinic.address,
                    address_maps_link: record.clinic.address_maps_link || "",
                });
            }
            }

            doctorPersonalData.push({
                id: user.id,
                name: user.name,
                gender: user.gender,
                age,
                specialization: doctor.specialization,
                phone: user.phone,
                fees: representativeRecord.fees,
                clinics: allClinics,
            });
        }

        return doctorPersonalData;
    }


}



