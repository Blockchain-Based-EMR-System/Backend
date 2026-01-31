import {Server as HttpServer} from 'http';
import {Server, Socket} from 'socket.io';
import { Service } from 'typedi';
import { verify } from 'jsonwebtoken';
import { DataStoredInToken } from '@/interfaces';
import { SECRET_KEY } from '@/config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

@Service()
export class SocketService {
    private io: Server;
    // userId --> set of socketIds (each tab/device = different socketId)
    private userSocketMap: Map<string, Set<string>> = new Map();

    public initialize(httpServer: HttpServer): void {
        this.io = new Server(httpServer, {
            cors: {
                origin: process.env.ORIGIN,
                credentials: true,
                // methods: ['GET', 'POST'], 
            },
            // polling is just a fallback if websocket fails
            transports: ['websocket', 'polling'],
        });
    }

    private async authMiddleware(socket: AuthenticatedSocket, next: (err?: Error) => void): Promise<void> {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers['authorization']?.split(' ')[1];
            if (!token) {
                return next(new Error('Authentication error: Token not provided'));
            }

            const decoded = verify(token, SECRET_KEY) as DataStoredInToken;
            socket.userId = decoded.id;
            // socket.userRole = decoded.role;
            next();
        } catch (error) {
            next(new Error('Authentication error: Invalid token'));
        }
    }

    private handleConnection(socket: AuthenticatedSocket): void {
        const userId = socket.userId;

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

        // this.sendInitialAppointments(userId);
        

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

}
