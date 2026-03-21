import 'reflect-metadata';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { NODE_ENV, PORT, LOG_FORMAT, ORIGIN, CREDENTIALS } from '@config';
import { Routes } from '@interfaces/routes.interface';
import { ErrorMiddleware } from '@middlewares/error.middleware';
import { logger, stream } from '@utils/logger';
// Google OAuth Imports
import passport from 'passport';
import '@utils/passsportGoogle';
import { createServer, Server as HttpServer } from 'http';
import { SocketService } from '@/services/socket.service';
import { VacationCronService } from '@/services/cron.service';

export class App {
  public app: express.Application;
  public env: string;
  public port: string | number;
  public httpServer: HttpServer;
  private socketService: SocketService;

  constructor(routes: Routes[]) {
    this.app = express();
    this.env = NODE_ENV || 'development';
    this.port = PORT || 3000;
    this.httpServer = createServer(this.app);

    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeErrorHandling();
    this.initializeSwagger();

    this.socketService = new SocketService();
    this.socketService.initialize(this.httpServer);

    VacationCronService.startCronJobs();

  }

  public listen() {
    this.httpServer.listen(this.port);

    this.httpServer.on('listening', () => {
      logger.info(`=================================`);
      logger.info(`======= ENV: ${this.env} =======`);
      logger.info(`🚀 App listeningg on the port ${this.port}`);
      logger.info(`=================================`);
    });

    this.httpServer.on('error', (error: any) => {
      logger.error('Server failed to start');
      logger.error(error);
      process.exit(1);
    });
  }

  public getServer() {
    return this.app;
  }


  private initializeMiddlewares() {
    this.app.use(morgan(LOG_FORMAT, { stream }));
    this.app.use(cors({ origin: ORIGIN, credentials: CREDENTIALS }));
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
    this.app.use(passport.initialize());
    this.app.use(express.json({ limit: '5mb' }));
    this.app.use(express.urlencoded({ limit: '5mb', extended: true }));
  }


  private initializeRoutes(routes: Routes[]) {
    routes.forEach(route => {
      this.app.use('/', route.router);
    });
  }

  private initializeSwagger() {
    const swaggerFile = require('./swagger-output.json'); // Path to the generated swagger file
    const swaggerUi = require('swagger-ui-express');

    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
  }

  private initializeErrorHandling() {
    this.app.use(ErrorMiddleware);
  }
}