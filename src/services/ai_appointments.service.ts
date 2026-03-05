import { B2_BUCKET_NAME } from "@/config";
import prisma from "@/config/prisma";
import s3Client from "@/config/storage";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Service } from "typedi";


@Service()
export class AiAppointmentsService {
    private appointments = prisma.appointment;

    public async checkAppointmentExistence(appointmentId: string): Promise<boolean> {
        const appointment = await this.appointments.findUnique({
            where: { id: appointmentId }
        });
        return appointment !== null;
    }
    
    public async getUploadUrl(objectKey: string): Promise<string> {

        const command = new PutObjectCommand({
            Bucket: B2_BUCKET_NAME,
            Key: objectKey,
            ContentType: 'audio/webm',
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL valid for 1 hour

        return uploadUrl;
    }
}