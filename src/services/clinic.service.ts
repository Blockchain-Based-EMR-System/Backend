import { ClinicActiveStatusResponseDto, ClinicResponseDto, CreateUpdateClinicRequestDto } from "@/dtos/clinics.dto";
import { Service } from "typedi";
import prisma from "@/config/prisma";
import { Clinic } from "@/interfaces";
import { DoctorPersonalData } from "@/interfaces/doctors.interface";
import { Doctor, Gender } from "@prisma/client";
import { createBilingualError, ErrorMessages } from "@/utils/errorMessages";
import { HttpException } from "@/exceptions/HttpException";
import { UserService } from "./user.service";

@Service()
export class ClinicService {
    private userService = new UserService();
    private MAX_CLINICS_PER_DOCTOR = 3;

    public async isDoctorAllowedToCreateClinic(doctorId: string): Promise<boolean> {
        const doctor = await prisma.doctor.findUnique({
            where: {
                id: doctorId,
            },
            select: {
                num_of_created_clinics: true,
            }
        });
        if (!doctor) {
            return false;
        }
        return doctor.num_of_created_clinics <= this.MAX_CLINICS_PER_DOCTOR;
    }

    public async createClinic(doctorId: string, clinicData: CreateUpdateClinicRequestDto): Promise<string> {

        const createdClinic = await prisma.clinic.create({
            data: {
                name: clinicData.name,
                opening_at: clinicData.opening_at,
                closing_at: clinicData.closing_at,
                address: clinicData.address,
                address_maps_link: clinicData.address_maps_link,
                phone: clinicData.phone,
                canPayOnline: clinicData.canPayOnline,
                created_by: doctorId,
                is_active: false,
            },
            select: {
                id: true,
            }
        });

        return createdClinic.id;
    }

    public async linkDoctorToClinic(doctorId: string, clinicId: string, fees: number): Promise<void> {
        await prisma.clinicDoctor.create({
            data: {
                doctor_id: doctorId,
                clinic_id: clinicId,
                fees,
            }
        });

        await prisma.doctor.update({
            where: {
                id: doctorId,
            },
            data: {
                num_of_created_clinics: {
                    increment: 1,
                }
            }
        });
    }

    public async getClinicById(clinicId: string): Promise<ClinicResponseDto | null> {
        const clinic = await prisma.clinic.findUnique({
            where: {
                id: clinicId,
            },
            select: {
                id: true,
                name: true,
                is_active: true,
                opening_at: true,
                closing_at: true,
                address: true,
                address_maps_link: true,
                phone: true,
                canPayOnline: true,
                created_at: true,
            }
        });

        return clinic;
    }

    public async updateClinic(doctorId: string, clinicId: string, clinicData: CreateUpdateClinicRequestDto): Promise<boolean> {
        const { fees, ...clinicUpdateData } = clinicData;
        const updatedClinic = await prisma.clinic.update({
            where: {
                id: clinicId,
            },
            data: {
                ...clinicUpdateData,
            },
        });
        const clinicDoctor = await prisma.clinicDoctor.update({
            where: {
                clinic_id_doctor_id: {
                    clinic_id: clinicId,
                    doctor_id: doctorId,
                }
            },
            data: {
                fees,
            }
        });
        return (updatedClinic && clinicDoctor) !== null;
    }

    public async isCreatingDoctorOfClinic(doctorId: string, clinicId: string): Promise<boolean> {
        const clinic = await prisma.clinic.findUnique({
            where: {
                id: clinicId,
            },
            select: {
                created_by: true,
            }
        });
        if (!clinic) {
            return false;
        }
        return clinic.created_by === doctorId;
    }

    public async deleteClinic(clinicId: string): Promise<void> {
        const clinicDoctors = await prisma.clinicDoctor.findMany({
            where: {
                clinic_id: clinicId,
            },
            select: {
                doctor_id: true,
            }
        });
        const deletedClinic = await prisma.$transaction(async (tx) => {
            await tx.clinicDoctor.deleteMany({
                where: {
                    clinic_id: clinicId,
                },
            });
            await tx.clinicNurse.deleteMany({
                where: {
                    clinic_id: clinicId,
                }
            });
            await tx.clinic.delete({
                where: {
                    id: clinicId,
                }
            });
            await Promise.all(clinicDoctors.map(async (cd) => {
                await tx.doctor.update({
                    where: {
                        id: cd.doctor_id,
                    },
                    data: {
                        num_of_created_clinics: {
                            decrement: 1,
                        }
                    }
                });
            }));
        });
    }

    public async getDoctorClinics(doctorId: string): Promise<Partial<Clinic>[]> {
        const clinics = await prisma.clinicDoctor.findMany({
            where: {
                doctor_id: doctorId
            },
            select: {
                clinic: {
                    select: {
                        id: true,
                        name: true,
                        opening_at: true,
                        closing_at: true,
                        address: true,
                        address_maps_link: true,
                        phone: true,
                        is_active: true,
                        canPayOnline: true,
                        created_at: true,
                        created_by: true,
                    }
                },
                fees: true
            }
        });
        return clinics.map(c => {
            let isOwner = true;
            if (c.clinic.created_by !== doctorId) {
                isOwner = false;
            }
            return {
                ...c.clinic,
                fees: c.fees,
                isOwner
            }
        });
    }

    public async getClinicDoctors(clinicId: string, gender?: Gender, minFees?: number, maxFees?: number): Promise<Partial<DoctorPersonalData>[]> {
        const doctors = await prisma.clinicDoctor.findMany({
            where: {
                clinic_id: clinicId,
                is_accepting: true,
                fees: {
                    ...(minFees !== undefined && { gte: minFees }),
                    ...(maxFees !== undefined && { lte: maxFees })
                },
                doctor: {
                    account_status: 'APPROVED',
                    present: true,
                    availability_type: {
                        in: ['OFFLINE', 'BOTH']
                    },
                    user: {
                        ...(gender && { gender }),
                    }

                },
            },
            select: {
                fees: true,
                doctor: {
                    select: {
                        specialization: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                gender: true,
                                date_of_birth: true,
                                phone: true,
                                photo_url: true,
                            },
                        },
                    },
                },
            },
        });

        const results = await Promise.all(
            doctors.map(async (doc) => {
                const user = doc.doctor.user;
                const age = await this.userService.calculateUserAge(user.date_of_birth);

                const doctorData = {
                    id: user.id,
                    name: user.name,
                    gender: user.gender,
                    age,
                    specialization: doc.doctor.specialization,
                    phone: user.phone,
                    fees: doc.fees,
                    profilePic: user.photo_url,
                } satisfies Partial<DoctorPersonalData>;

                return doctorData;
            })
        );

        return results;
    }

    public async getActiveClinics(payOnline?: boolean): Promise<Partial<Clinic>[]> {
        const clinics = await prisma.clinic.findMany({
            where: {
                is_active: true,
                deleted_at: null,
                ...(payOnline !== undefined && { canPayOnline: payOnline }),
            },
            select: {
                id: true,
                name: true,
                opening_at: true,
                closing_at: true,
                address: true,
                address_maps_link: true,
                phone: true,
                canPayOnline: true,
            }
        });
        return clinics.map(c => ({
            ...c
        }));
    }

    public async getAllClinics(): Promise<ClinicResponseDto[]> {
        const clinics = await prisma.clinic.findMany({
            select: {
                id: true,
                name: true,
                address: true,
                phone: true,
                is_active: true,
                opening_at: true,
                closing_at: true,
                canPayOnline: true,
                address_maps_link: true,
            }
        });
        return clinics;
    }
    public async setClinicActiveStatus(clinicId: string, is_active: boolean): Promise<ClinicActiveStatusResponseDto> {
        const updatedClinic = await prisma.clinic.update({
            where: {
                id: clinicId,
            },
            data: {
                is_active
            },
            select: {
                id: true,
                name: true,
                is_active: true,
            }
        });
        if (!updatedClinic) {
            const error = createBilingualError(404, ErrorMessages.CLINIC_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        return updatedClinic;
    }

    public async isDoctorLinkedToClinic(doctorId: string, clinicId: string): Promise<boolean> {
        const clinicDoctor = await prisma.clinicDoctor.findUnique({
            where: {
                clinic_id_doctor_id: {
                    clinic_id: clinicId,
                    doctor_id: doctorId,
                }
            }
        });
        if (clinicDoctor === null) {
            return false;
        }
        return true;
    }

    public async updateClinicFees(doctorId: string, clinicId: string, fees: number): Promise<boolean> {
        const clinicDoctor = await prisma.clinicDoctor.update({
            where: {
                clinic_id_doctor_id: {
                    clinic_id: clinicId,
                    doctor_id: doctorId,
                }
            },
            data: {
                fees,
            }
        });
        if (clinicDoctor === null) {
            return false;
        }
        return true;
    }
}