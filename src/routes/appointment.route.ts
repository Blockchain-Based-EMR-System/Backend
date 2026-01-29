import { Routes } from "@/interfaces";
import { Router } from "express";
import { ClinicController } from "@/controllers/clinic.controller";
import { DoctorController } from "@/controllers/doctor.controller";
import { AppointmentController } from "@/controllers/appointment.controller";
import { ValidationMiddleware } from "@/middlewares/validation.middleware";
import { AuthMiddleware } from "@/middlewares/auth.middleware";
import { BookAppointmentDto } from "@/dtos/appointments.dto";

export class AppointmentRoute implements Routes {
    public path = '/appointments';
    public router = Router();
    clinicController = new ClinicController();
    doctorController = new DoctorController();
    appointmentController = new AppointmentController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        // get online doctors
        this.router.get(
            `${this.path}/online-doctors`,
            /* 
                #swagger.path = '/appointments/online-doctors'
                #swagger.method = 'get'
                #swagger.tags = ['Appointments']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Get all available online doctors'
                #swagger.responses[200] = {
                    description: 'Online doctors retrieved successfully',
                    schema: {
                        data: [
                            {
                                id: 'doctor-uuid',
                                name: 'House'
                            }
                        ],
                        message: 'Online doctors retrieved successfully'
                    }
                }
            */
            AuthMiddleware,
            this.doctorController.getOnlineDoctors
        );

        // get all clinics
        this.router.get(
            `${this.path}/clinics`,
            /* 
                #swagger.path = '/appointments/clinics'
                #swagger.method = 'get'
                #swagger.tags = ['Appointments']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
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
            AuthMiddleware,
            this.clinicController.getActiveClinics
        );

        // get all doctors in a clinic
        this.router.get(
            `${this.path}/clinic/:clinicId/doctors`,
            /* 
                #swagger.path = '/appointments/clinic/{clinicId}/doctors'
                #swagger.method = 'get'
                #swagger.tags = ['Appointments']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Get all doctors who are accepting appointments at a selected clinic'
                #swagger.parameters['clinicId'] = {
                    in: 'path',
                    description: 'Clinic ID',
                    required: true,
                    type: 'string'
                }
                #swagger.responses[200] = {
                    description: 'Clinic doctors retrieved successfully',
                    schema: {
                        data: [
                            {
                                id: 'clinic-uuid',
                                name: 'House'
                            }
                        ],
                        message: 'Clinic doctors retrieved successfully'
                    }
                }
            */
            AuthMiddleware,
            this.clinicController.getClinicDoctors
        );

        // get available days
        this.router.get(
            `${this.path}/doctor/:doctorId/available-days`,
            /* 
                #swagger.path = '/appointments/doctor/{doctorId}/available-days'
                #swagger.method = 'get'
                #swagger.tags = ['Appointments']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Get all available days for a doctor that have at least one available slot'
                #swagger.parameters['doctorId'] = {
                    in: 'path',
                    description: 'Doctor ID',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['clinicId'] = {
                    in: 'query',
                    description: 'Clinic ID (required for offline appointments)',
                    required: false,
                    type: 'string'
                }
                #swagger.responses[200] = {
                    description: 'Available days retrieved successfully',
                    schema: {
                        data: [
                            {
                                date: '2026-02-03',
                                dayOfWeek: 'MONDAY',
                                displayDate: 'Monday, February 3, 2026'
                            },
                            {
                                date: '2026-02-05',
                                dayOfWeek: 'WEDNESDAY',
                                displayDate: 'Wednesday, February 5, 2026'
                            },
                            {
                                date: '2026-02-10',
                                dayOfWeek: 'MONDAY',
                                displayDate: 'Monday, February 10, 2026'
                            }
                        ],
                        message: 'Available days retrieved successfully',
                    }
                }
                #swagger.responses[400] = {
                    description: 'Bad request - missing required parameters'
                }
                #swagger.responses[404] = {
                    description: 'Doctor not found or not available'
                }
            */
            AuthMiddleware,
            this.appointmentController.getAvailableDays
        );

        // get all available slots 
        this.router.get(
            `${this.path}/doctor/:doctorId/available-slots`,
            /* 
                #swagger.path = '/appointments/doctor/{doctorId}/available-slots'
                #swagger.method = 'get'
                #swagger.tags = ['Appointments']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Get all available time slots for a doctor on a specific date'
                #swagger.parameters['doctorId'] = {
                    in: 'path',
                    description: 'Doctor ID',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['date'] = {
                    in: 'query',
                    description: 'Date in YYYY-MM-DD format',
                    required: true,
                    type: 'string',
                    example: '2026-02-03'
                }
                #swagger.parameters['clinicId'] = {
                    in: 'query',
                    description: 'Clinic ID (required for offline appointments)',
                    required: false,
                    type: 'string'
                }
                #swagger.responses[200] = {
                    description: 'Available slots retrieved successfully',
                    schema: {
                        data: [
                            {
                                start: '09:00',
                                end: '09:20'
                            },
                            {
                                start: '09:30',
                                end: '09:50'
                            },
                            {
                                start: '10:00',
                                end: '10:20'
                            },
                            {
                                start: '10:30',
                                end: '10:50'
                            }
                        ],
                        message: 'Available slots retrieved successfully',
                    }
                }
                #swagger.responses[400] = {
                    description: 'Bad request - missing required parameters or invalid date'
                }
            */
            AuthMiddleware,
            this.appointmentController.getAvailableSlots
        );

        // book appointment
        this.router.post(
            `${this.path}/book`,
            /* 
                #swagger.path = '/appointments/book'
                #swagger.method = 'post'
                #swagger.tags = ['Appointments']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Book a new appointment with a doctor'
                #swagger.security = [{
                    bearerAuth: []
                }]
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Appointment booking details',
                    required: true,
                    schema: {
                        doctorId: 'doctor-uuid',
                        clinicId: 'clinic-uuid',
                        scheduledTime: '2026-02-03T09:00:00.000Z'
                    }
                }
                #swagger.responses[201] = {
                    description: 'Appointment booked successfully',
                    schema: {
                        message: 'Appointment booked successfully'
                    }
                }
                #swagger.responses[400] = {
                    description: 'Bad request - invalid data or slot not available',
                    schema: {
                        message: 'Error message describing the issue'
                    }
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized - user not authenticated'
                }
            */
            AuthMiddleware,
            ValidationMiddleware(BookAppointmentDto),
            this.appointmentController.bookAppointment
        );

        this.router.get(
            `${this.path}/patient/:patientId/appointments`,
            /* 
                #swagger.path = '/appointments/patient/{patientId}/appointments'
                #swagger.method = 'get'
                #swagger.tags = ['Appointments']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Get all appointments for a specific patient. Note: clinic_name and clinic_address will be null for online appointments'
                #swagger.parameters['patientId'] = {
                    in: 'path',
                    description: 'Patient ID',
                    required: true,
                    type: 'string'
                }
                #swagger.responses[200] = {
                    description: 'Patient appointments retrieved successfully',
                    schema: {
                        data: [
                            {
                                id: 'appointment-uuid',
                                status: 'CONFIRMED',
                                is_online: true,
                                slot_duration: 20,
                                doctor_name: 'House',
                                appointment_date: '2026-02-03',
                                start_time: '09:00',
                                end_time: '09:20',
                                clinic_name: 'Medical Park Clinic',
                                clinic_address: '123 Main Street, New Cairo'
                            },
                            {
                                id: 'appointment-uuid-2',
                                status: 'CONFIRMED',
                                is_online: true,
                                slot_duration: 30,
                                doctor_name: 'Wilson',
                                appointment_date: '2026-02-05',
                                start_time: '14:00',
                                end_time: '14:30',
                                clinic_name: null,
                                clinic_address: null
                            }
                        ],
                        message: 'Patient appointments retrieved successfully'
                    }
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized - user not authenticated'
                }
                #swagger.responses[404] = {
                    description: 'Patient not found'
                }
            */
            AuthMiddleware,
            this.appointmentController.getPatientAppointments
        );

        this.router.get(
            `${this.path}/patient/:patientId/appointment/:appointmentId`,
            /*
                #swagger.path = '/appointments/patient/{patientId}/appointment/{appointmentId}'
                #swagger.method = 'get'
                #swagger.tags = ['Appointments']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Get details of a specific appointment for a patient. Note: clinic_name and clinic_address will be null for online appointments'
                #swagger.parameters['patientId'] = {
                    in: 'path',
                    description: 'Patient ID',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['appointmentId'] = {
                    in: 'path',
                    description: 'Appointment ID',
                    required: true,
                    type: 'string'
                }
                #swagger.responses[200] = {
                    description: 'Appointment details retrieved successfully',
                    schema: {
                        data: {
                            id: 'appointment-uuid',
                            status: 'CONFIRMED',
                            is_online: true,
                            slot_duration: 20,
                            doctor_name: 'House',
                            appointment_date: '2026-02-03',
                            start_time: '09:00',
                            end_time: '09:20',
                            clinic_name: 'Medical Park Clinic',
                            clinic_address: '123 Main Street, New Cairo'
                        },
                        message: 'Appointment details retrieved successfully'
                    }
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized - user not authenticated'
                }
                #swagger.responses[404] = {
                    description: 'Appointment not found'
                }
            */
            AuthMiddleware,
            this.appointmentController.getPatientSelectedAppointment
        );

        this.router.patch(
            `${this.path}/patient/:patientId/appointment/:appointmentId/reschedule`,
            /* 
                #swagger.path = '/appointments/patient/{patientId}/appointment/{appointmentId}/reschedule'
                #swagger.method = 'patch'
                #swagger.tags = ['Appointments']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Reschedule an existing appointment to a new time slot'
                #swagger.parameters['patientId'] = {
                    in: 'path',
                    description: 'Patient ID',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['appointmentId'] = {
                    in: 'path',
                    description: 'Appointment ID to reschedule',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'New scheduled time for the appointment',
                    required: true,
                    schema: {
                        newScheduledTime: '2026-02-05T11:00:00.000Z'
                    }
                }
                #swagger.responses[200] = {
                    description: 'Appointment rescheduled successfully',
                    schema: {
                        message: 'Appointment rescheduled successfully'
                    }
                }
                #swagger.responses[400] = {
                    description: 'Bad request - invalid time or slot not available',
                    schema: {
                        message: 'Error message describing the issue'
                    }
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized - user not authenticated'
                }
                #swagger.responses[404] = {
                    description: 'Appointment not found'
                }
            */
            
            AuthMiddleware,
            this.appointmentController.rescheduleAppointmentByPatient
        );

        this.router.delete(
            `${this.path}/:appointmentId/cancel`,
            /* 
                #swagger.path = '/appointments/{appointmentId}/cancel'
                #swagger.method = 'delete'
                #swagger.tags = ['Appointments']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Cancel an appointment (soft delete). Can be cancelled by either patient or doctor.'
                #swagger.parameters['appointmentId'] = {
                    in: 'path',
                    description: 'Appointment ID to cancel',
                    required: true,
                    type: 'string'
                }
                #swagger.responses[200] = {
                    description: 'Appointment cancelled successfully',
                    schema: {
                        success: true,
                        message: 'Appointment cancelled successfully',
                        data: {
                            appointmentId: 'appointment-uuid',
                            cancelledAt: '2026-01-29T12:00:00.000Z'
                        }
                    }
                }
                #swagger.responses[400] = {
                    description: 'Bad request - appointment already cancelled, completed, or too late to cancel',
                    schema: {
                        message: 'Error message describing the issue'
                    }
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized - user not authenticated'
                }
                #swagger.responses[403] = {
                    description: 'Forbidden - user is not the patient or doctor of this appointment'
                }
                #swagger.responses[404] = {
                    description: 'Appointment not found'
                }
            */
            AuthMiddleware,
            this.appointmentController.cancelAppointment
        );

        this.router.patch(
            `${this.path}/doctor/:appointmentId/reschedule`,
            /* 
                #swagger.path = '/appointments/doctor/{appointmentId}/reschedule'
                #swagger.method = 'patch'
                #swagger.tags = ['Appointments']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication (doctor)',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Reschedule an appointment by the doctor. Doctor can either shift the appointment by a number of minutes or set a new scheduled time (but not both)'
                #swagger.parameters['appointmentId'] = {
                    in: 'path',
                    description: 'Appointment ID to reschedule',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Reschedule parameters (provide either minutes OR newScheduledTime)',
                    required: true,
                    schema: {
                        minutes: 15,
                        newScheduledTime: '2026-02-05T11:30:00.000Z'
                    }
                }
                #swagger.responses[200] = {
                    description: 'Appointment rescheduled successfully',
                    schema: {
                        message: 'Appointment rescheduled successfully'
                    }
                }
                #swagger.responses[400] = {
                    description: 'Bad request - invalid reschedule parameters',
                    schema: {
                        message: 'Error message describing the issue'
                    }
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized - doctor not authenticated'
                }
                #swagger.responses[403] = {
                    description: 'Forbidden - appointment does not belong to the authenticated doctor'
                }
                #swagger.responses[404] = {
                    description: 'Appointment not found'
                }
            */
            AuthMiddleware,
            this.appointmentController.rescheduleAppointmentByDoctor
        );  


    }
}

