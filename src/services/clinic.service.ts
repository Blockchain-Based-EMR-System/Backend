import { CreateClinicRequestDto } from "@/dtos/clinics.dto";
import { Service } from "typedi";
import prisma from "@/config/prisma";

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

    public async createClinic(doctorId: string, clinicData: CreateClinicRequestDto): Promise<string> {

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
}