import cron from 'node-cron';
import prisma from '@/config/prisma';
import { Service, Container } from 'typedi';

@Service()
export class VacationCronService {

    private static async runScheduledTasks() {        
        try {
            await this.updateVacationStatuses();
            await this.reactivateEndedSchedules();
        } catch (e) {
            console.error('error running cron service:', e);
        }
    }

    static startCronJobs() {
        // run every hour
        // cron.schedule('0 * * * *', async () => {
        //     await this.runScheduledTasks();
        // });

        // run at midnight
        cron.schedule('0 0 * * *', async () => {
            console.log('[Cron] Running midnight status update');
            await this.runScheduledTasks();
        });

        this.runScheduledTasks();
    }

    static async runManually() {
        return await this.runScheduledTasks();
    }

    private static async updateVacationStatuses() {
        try {
            // YYYY-MM-DD format
            const today = new Date().toISOString().split('T')[0];

            await prisma.vacation.updateMany({
                where: {
                    status: 'UPCOMING',
                    start_date: {
                        lte: today,
                    },
                    end_date: {
                        gte: today,
                    },
                },
                data: {
                    status: 'CURRENT',
                },
            });

            await prisma.vacation.updateMany({
                where: {
                    status: 'CURRENT',
                    end_date: {
                        lt: today,
                    },
                },
                data: {
                    status: 'ENDED',
                },
            });
        }
        catch (e) {
            console.error('vacation status Update Error', e);
            throw e;
        }
    }


    private static async reactivateEndedSchedules() {
        try {
            const today = new Date().toISOString().split('T')[0];

            const endedSchedules = await prisma.doctorSchedule.findMany({
                where: {
                    is_active: false,
                    break_end: {
                        not: null,
                        lte: today, 
                    },
                },
                include: {
                    vacations: {
                        where: {
                            end_date: {
                                lt: today,
                            },
                        },
                    },
                },
            });

            for (const schedule of endedSchedules) {
                await prisma.doctorSchedule.update({
                    where: { id: schedule.id },
                    data: {
                        is_active: true,
                        break_start: null,
                        break_end: null,
                    },
                });

                await prisma.vacation.updateMany({
                    where: { 
                        schedule_id: schedule.id,
                        status: 'ENDED',
                        deleted_at: null, 
                    },
                    data: {
                        deleted_at: new Date()
                    },
                });

            }
        } 
        catch (e) {
            console.error('schedule eeactivation error]', e);
            throw e;
        }
    }
}