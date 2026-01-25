import { CreateUpdateClinicRequestDto } from "@/dtos/clinics.dto";
import { Service } from "typedi";
import prisma from "@/config/prisma";
import { Clinic } from "@/interfaces";

@Service()
export class ClinicService {
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

    public async getClinicById(clinicId: string): Promise<Partial<Clinic> | null> {
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

    public async updateClinic(clinicId: string, clinicData: CreateUpdateClinicRequestDto): Promise<boolean> {
        const updatedClinic = await prisma.clinic.update({
            where: {
                id: clinicId,
            },
            data: {
                ...clinicData,
            },
        });
        return updatedClinic !== null;
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
                    }
                },
                fees: true
            }
        });

        return clinics.map(c => ({
            ...c.clinic,
            fees: c.fees
        }));
    }
}