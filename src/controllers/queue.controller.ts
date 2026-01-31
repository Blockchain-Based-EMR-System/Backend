import { Request, Response, NextFunction } from "express";
import { RequestWithUser } from "@/interfaces";
import { HttpException } from "@/exceptions/HttpException";
import { catchAsync } from '@/utils/catchAsync';
import Container from "typedi";
import { createBilingualError, ErrorMessages } from '@/utils/errorMessages';
import { SuccessResponseMessages, createMultiLangMessage } from '@/utils/responseMessages';

import { QueueService } from "@/services/queue.service";

export class QueueController {

    public queueService = Container.get(QueueService);

    public getQueuePosition = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const { appointmentId } = req.params;

        if (!appointmentId) {
            const error = createBilingualError(400, ErrorMessages.APPOINTMENT_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const queuePosition = await this.queueService.getQueuePosition(appointmentId);
        const response = createMultiLangMessage(SuccessResponseMessages.QUEUE_POSITION_RETRIEVED);
        res.status(200).json({
            data: queuePosition,
            ...response
        });

    });
}