import { Routes } from "@/interfaces";
import { Router } from "express";
import { ClinicController } from "@/controllers/clinic.controller";


export class AppointmentRoute implements Routes {
    public path = '/appointments';
    public router = Router();
    clinicController = new ClinicController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        // // get online doctors
        // this.router.get(
        //     `${this.path}/online-doctors`
        // );

        // get all clinics
        this.router.get(
            `${this.path}/clinics`,
            /* 
                #swagger.path = '/appointments/clinics'
                #swagger.method = 'get'
                #swagger.tags = ['Appointments']
                #swagger.description = 'Get all clinics available for booking appointments'
                #swagger.responses[200] = {
                    description: 'Active clinics retrieved successfully',
                    schema: {
                        data: [
                            {
                                id: 'clinic-uuid',
                                name: 'New Cairo Medical Clinic',
                                opening_at: '10:00',
                                closing_at: '17:00',
                                address: '123 Main Street, Medical Park',
                                address_maps_link: 'https://maps.google.com/?q=123+Main+Street',
                                phone: '+1234567890',
                                canPayOnline: true
                            }
                        ],
                        message: 'Clinics retrieved successfully'
                    }
                }
            */
            this.clinicController.getActiveClinics
        );

        // // get all doctors in a clinic
        // this.router.get(
        //     `${this.path}/clinic/:clinicId/doctors`,
        // );

        // // get available days
        // this.router.get(
        //     `${this.path}/available-days`,
    
        // );

        // // get all available slots 
        // this.router.get(
        //     `${this.path}/available-slots`
        // );

        // // book appointment
        // this.router.post(
        //     `${this.path}/book-appointment`
        // )
    }


}

