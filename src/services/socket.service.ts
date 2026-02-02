import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { SocketStoredInToken } from '@/interfaces';
import { SECRET_KEY } from '@/config';
import prisma from '@/config/prisma';
import { AppointmentService } from './appointment.service';
import { QueueService } from './queue.service';
import { Container } from 'typedi';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    userRole?: string;
}

export class SocketService {
    private io: Server;
    // userId --> set of socketIds (each tab/device = different socketId)
    private userSocketMap: Map<string, Set<string>> = new Map();
    private appointmentService = Container.get(AppointmentService);
    private queueService = Container.get(QueueService);

    public initialize(httpServer: HttpServer): void {
        this.io = new Server(httpServer, {
            cors: {
                origin: process.env.ORIGIN,
                credentials: true,
                
            },
            // polling is just a fallback if websocket fails
            transports: ['websocket', 'polling'],
        });
        this.io.use(this.authMiddleware.bind(this));
        this.io.on('connection', this.handleConnection.bind(this));
    }
    public isUserConnected(userId: string): boolean {
        return this.userSocketMap.has(userId) && this.userSocketMap.get(userId).size > 0;
    }

    public getTotalConnectedUsers(): number {
        return this.userSocketMap.size;
    }

    public getIO(): Server {
        return this.io;
    }

    private async authMiddleware(socket: AuthenticatedSocket, next: (err?: Error) => void): Promise<void> {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers['authorization']?.split(' ')[1];
            if (!token) {
                return next(new Error('Authentication error: Token not provided'));
            }

            const decoded = verify(token, SECRET_KEY) as SocketStoredInToken;
            socket.userId = decoded.id;
            socket.userRole = decoded.role;
            next();
        } catch (error) {
            next(new Error('Authentication error: Invalid token'));
        }
    }

    private handleConnection(socket: AuthenticatedSocket): void {
        const userId = socket.userId;
        const userRole = socket.userRole;

        if (!userId) {
            socket.disconnect();
            return;
        }

        if (!this.userSocketMap.has(userId)) {
            this.userSocketMap.set(userId, new Set());
        }
        this.userSocketMap.get(userId)?.add(socket.id);

        // personal room (all tabs/devices get the event)
        socket.join(`user_${userId}`);

        socket.on('disconnect', () => {
            this.handleDisconnection(socket);
        });

        socket.emit('connected', {
            message: 'Successfully connected to socket server',
            userId: userId
        });

        if (userRole === 'PATIENT') {
            this.sendInitialPatientData(userId);
        } else if (userRole === 'DOCTOR') {
            this.sendInitialDoctorData(userId);
        }

    }

    private handleDisconnection(socket: AuthenticatedSocket): void {
        const userId = socket.userId;
        if (!userId) return;

        if (userId && this.userSocketMap.has(userId)) {
            this.userSocketMap.get(userId).delete(socket.id);

            if (this.userSocketMap.get(userId).size === 0) {
                this.userSocketMap.delete(userId);
            }
        }
    }

    public emitToUser(userId: string, event: string, data: any): void {
        if (this.isUserConnected(userId)) {
            this.io.to(`user_${userId}`).emit(event, data);
        }
    }

    public async emitQueueUpdatesToPatients(doctorId: string, date: Date): Promise<void> {
        const appointments = await this.getAppointmentsForDay(doctorId, date); 
        for (const app of appointments) {
            const queuePosition = await this.queueService.getQueuePosition(app.id);
            this.emitToUser(app.patient_id, 'queue_updated', queuePosition);
        }
    }

    private async getAppointmentsForDay(doctorId: string, date: Date): Promise<{ id: string; patient_id: string }[]> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date); 
        endOfDay.setHours(23, 59, 59, 999);


        return prisma.appointment.findMany({
            where: {
                doctor_id: doctorId,
                scheduled_time: { 
                    gte: startOfDay, 
                    lte: endOfDay 
                },
                status: { in: ['CONFIRMED'] },
                deleted_at: null,
            },
            select: {
                id: true,
                patient_id: true

            },
        });
    }

    private async sendInitialPatientData(patientId: string): Promise<void> {
        try {
            const appointments = await this.appointmentService.getPatientAppointments(patientId);
            const appointmentsWithQueue = await Promise.all(appointments.map(async (app) => {
                await this.queueService.calculateQueuePosition(app.id); // Ensure up-to-date
                const queuePosition = await this.queueService.getQueuePosition(app.id);
                return { ...app, queuePosition };
            }));
            this.emitToUser(patientId, 'initial_data', { appointments: appointmentsWithQueue });
        } catch (error) {
            console.error('Error sending initial patient data:', error);
        }
    }

    private async sendInitialDoctorData(doctorId: string): Promise<void> {
        try {
            const schedule = await this.appointmentService.getDoctorSchedule(doctorId);
            this.emitToUser(doctorId, 'initial_data', { schedule });
        } catch (error) {
            console.error('error sending initial doctor data:', error);
        }
    }
}