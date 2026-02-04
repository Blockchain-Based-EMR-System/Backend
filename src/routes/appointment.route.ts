import { Routes } from "@/interfaces";
import { Router } from "express";
import { ClinicController } from "@/controllers/clinic.controller";
import { DoctorController } from "@/controllers/doctor.controller";
import { AppointmentController } from "@/controllers/appointment.controller";
import { ValidationMiddleware } from "@/middlewares/validation.middleware";
import { AuthMiddleware } from "@/middlewares/auth.middleware";
import { BookAppointmentDto, RescheduleAppointmentDto, RescheduleAppointmentByDoctorDto, EnterDoctorScheduleDto } from "@/dtos/appointments.dto";

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
                #swagger.description = 'Get available days for booking with a specific doctor (up to 30 days ahead)'
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
                            }
                        ],
                        message: 'Available days retrieved successfully'
                    }
                }
                #swagger.responses[400] = {
                    description: 'Bad request - missing doctor ID or invalid parameters'
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized - user not authenticated'
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
                #swagger.description = 'Get available time slots for a specific doctor on a given date'
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
                    type: 'string'
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
                                end: '09:20',
                                available: true,
                                online: true
                            },
                            {
                                start: '09:30',
                                end: '09:50',
                                available: false,
                                online: true
                            }
                        ],
                        message: 'Available slots retrieved successfully'
                    }
                }
                #swagger.responses[400] = {
                    description: 'Bad request - missing date, invalid format, or past date'
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized - user not authenticated'
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
            `${this.path}/patient/appointments`,
            /* 
                #swagger.path = '/appointments/patient/appointments'
                #swagger.method = 'get'
                #swagger.tags = ['Appointments']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication (must be a patient)',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Get all appointments for the patient'
                #swagger.responses[200] = {
                    description: 'Patient appointments retrieved successfully',
                    schema: {
                        data: [
                            {
                                id: 'appointment-uuid',
                                status: 'CONFIRMED',
                                slot_duration: 30,
                                doctor_name: 'Dr. House',
                                appointment_date: '2026-02-03',
                                start_time: '09:00',
                                end_time: '09:30',
                                clinic_name: 'New Cairo Medical Clinic',
                                clinic_address: '123 Main Street, Medical Park'
                            },
                            {
                                id: 'appointment-uuid',
                                status: 'CONFIRMED',
                                slot_duration: 20,
                                doctor_name: 'Dr. House',
                                appointment_date: '2026-03-03',
                                start_time: '09:00',
                                end_time: '09:20',
                                clinic_name: 'New Cairo Medical Clinic',
                                clinic_address: '123 Main Street, Medical Park'
                            }
                        ]
                    }
                }
                #swagger.responses[400] = {
                    description: 'Bad request - patient ID missing'
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized - patient not authenticated'
                }
            */
            AuthMiddleware,
            this.appointmentController.getPatientAppointments
        );

        this.router.get(
            `${this.path}/patient/:appointmentId`,
            /* 
                #swagger.path = '/appointments/patient/{appointmentId}'
                #swagger.method = 'get'
                #swagger.tags = ['Appointments']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication (must be a patient)',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Get details of a specific appointment for the patient'
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
                            slot_duration: 30,
                            doctor_name: 'Dr. House',
                            appointment_date: '2026-02-03',
                            start_time: '09:00',
                            end_time: '09:30',
                            clinic_name: 'New Cairo Medical Clinic',
                            clinic_address: '123 Main Street, Medical Park'
                        }
                    }
                }
                #swagger.responses[400] = {
                    description: 'Bad request - patient ID missing'
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized - patient not authenticated'
                }
                #swagger.responses[404] = {
                    description: 'Appointment not found or does not belong to the patient'
                }
            */
            AuthMiddleware,
            this.appointmentController.getPatientSelectedAppointment
        );

        this.router.get(
            `${this.path}/patient/today-appointment`,
            /* 
                #swagger.path = '/appointments/patient/today-appointment'
                #swagger.method = 'get'
                #swagger.tags = ['Appointments']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication (must be a patient)',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Get todays appointment for the patient, including queue position and estimated wait time'
                #swagger.responses[200] = {
                    description: 'Todays appointment details retrieved successfully',
                    schema: {
                        data: {
                            id: 'appointment-uuid',
                            status: 'CONFIRMED',
                            slot_duration: 30,
                            doctor_name: 'Dr. House',
                            appointment_date: '2026-02-03',
                            start_time: '09:00',
                            end_time: '09:30',
                            clinic_name: 'New Cairo Medical Clinic',
                            clinic_address: '123 Main Street, Medical Park',
                            position: 5,
                            estimated_time: 60,
                            patients_ahead: 3
                        }
                    }
                }
                #swagger.responses[400] = {
                    description: 'Bad request - patient ID missing'
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized - patient not authenticated'
                }
                #swagger.responses[404] = {
                    description: 'No appointment found for today'
                }
            */
            AuthMiddleware,
            this.appointmentController.getTodayAppointment
        );

        this.router.patch(
            `${this.path}/patient/:appointmentId/reschedule`,
            /* 
                #swagger.path = '/appointments/patient/{appointmentId}/reschedule'
                #swagger.method = 'patch'
                #swagger.tags = ['Appointments']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication (must be a patient)',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Reschedule an appointment to a new time by the patient'
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
                        newScheduledTime: '2026-02-10T10:30:00.000Z'
                    }
                }
                #swagger.responses[200] = {
                    description: 'Appointment rescheduled successfully',
                    schema: {
                        message: 'Appointment rescheduled successfully'
                    }
                }
                #swagger.responses[400] = {
                    description: 'Bad request - missing or invalid parameters (patient ID, new scheduled time, etc.)'
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized - patient not authenticated'
                }
                #swagger.responses[403] = {
                    description: 'Forbidden - appointment does not belong to the authenticated patient'
                }
                #swagger.responses[404] = {
                    description: 'Appointment not found or time slot not available'
                }
            */
            AuthMiddleware,
            ValidationMiddleware(RescheduleAppointmentDto),
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
                    description: 'Bearer token for authentication (must be a doctor)',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Reschedule an appointment by adding minutes (delay) as a doctor'
                #swagger.parameters['appointmentId'] = {
                    in: 'path',
                    description: 'Appointment ID to reschedule',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Minutes to add (max 60)',
                    required: true,
                    schema: {
                        minutes: 30
                    }
                }
                #swagger.responses[200] = {
                    description: 'Appointment rescheduled successfully',
                    schema: {
                        message: 'Appointment rescheduled successfully'
                    }
                }
                #swagger.responses[400] = {
                    description: 'Bad request - missing minutes, exceeds limit, or invalid parameters'
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized - doctor not authenticated'
                }
                #swagger.responses[403] = {
                    description: 'Forbidden - appointment does not belong to the doctor'
                }
                #swagger.responses[404] = {
                    description: 'Appointment not found'
                }
            */
            AuthMiddleware,
            ValidationMiddleware(RescheduleAppointmentByDoctorDto),
            this.appointmentController.rescheduleAppointmentByDoctor
        );

        this.router.get(
            `${this.path}/doctor/schedule`,
            /* 
                #swagger.path = '/appointments/doctor/schedule'
                #swagger.method = 'get'
                #swagger.tags = ['Appointments']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication (must be a doctor)',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Get the doctor's complete schedule with all appointments grouped by date'
                #swagger.responses[200] = {
                    description: 'Doctor schedule retrieved successfully',
                    schema: {
                        data: [
                            {
                                date: '2026-02-03',
                                displayDate: 'Monday, February 3, 2026',
                                appointments: [
                                    {
                                        id: 'appointment-uuid-1',
                                        status: 'CONFIRMED',
                                        slot_duration: 30,
                                        patient_name: 'John Doe',
                                        appointment_date: '2026-02-03',
                                        start_time: '09:00',
                                        end_time: '09:30',
                                        clinic_name: 'New Cairo Medical Clinic',
                                        clinic_address: '123 Main Street, Medical Park'
                                    },
                                    {
                                        id: 'appointment-uuid-2',
                                        status: 'CONFIRMED',
                                        slot_duration: 30,
                                        patient_name: 'Jane Smith',
                                        appointment_date: '2026-02-03',
                                        start_time: '10:00',
                                        end_time: '10:30',
                                        clinic_name: null,
                                        clinic_address: null
                                    }
                                ]
                            },
                            {
                                date: '2026-02-05',
                                displayDate: 'Wednesday, February 5, 2026',
                                appointments: [
                                    {
                                        id: 'appointment-uuid-3',
                                        status: 'CONFIRMED',
                                        slot_duration: 45,
                                        patient_name: 'Bob Johnson',
                                        appointment_date: '2026-02-05',
                                        start_time: '14:00',
                                        end_time: '14:45',
                                        clinic_name: 'Downtown Health Center',
                                        clinic_address: '456 Oak Avenue'
                                    }
                                ]
                            }
                        ]
                    }
                }
                #swagger.responses[400] = {
                    description: 'Bad request - doctor ID missing or invalid'
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized - doctor not authenticated'
                }
            */
            AuthMiddleware,
            this.appointmentController.getDoctorSchedule
        );

        this.router.post(
            `${this.path}/doctor/schedule`,
            /* 
                #swagger.path = '/appointments/doctor/schedule'
                #swagger.method = 'post'
                #swagger.tags = ['Appointments']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication (must be a doctor)',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Enter or update a doctor's schedule for a specific day'
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Schedule details',
                    required: true,
                    schema: {
                        clinicId: 'clinic-uuid (optional)',
                        workingDay: 1,
                        startTime: '09:00',
                        endTime: '17:00',
                        slotDuration: 30,
                        bufferTime: 5,
                        isOnline: true
                    }
                }
                #swagger.responses[201] = {
                    description: 'Schedule created successfully',
                    schema: {
                        message: 'Schedule created successfully'
                    }
                }
                #swagger.responses[400] = {
                    description: 'Bad request - invalid parameters or doctor ID missing'
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized - doctor not authenticated'
                }
            */
            AuthMiddleware,
            ValidationMiddleware(EnterDoctorScheduleDto),
            this.appointmentController.enterDoctorSchedule
        );

        this.router.get(
            `${this.path}/doctor/current-schedule`,
            /* 
                #swagger.path = '/appointments/doctor/current-schedule'
                #swagger.method = 'get'
                #swagger.tags = ['Appointments']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication (must be a doctor)',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Get all confirmed appointments for doctor today'
                #swagger.responses[200] = {
                    description: 'Today\'s appointments retrieved successfully',
                    schema: {
                        data: [
                            {
                                id: 'appointment-uuid',
                                status: 'CONFIRMED',
                                slot_duration: 30,
                                patient_name: 'John Doe',
                                appointment_date: '2026-02-03',
                                start_time: '09:00',
                                end_time: '09:30',
                                clinic_name: 'New Cairo Medical Clinic',
                                clinic_address: '123 Main Street, Medical Park'
                            },
                            {
                                id: 'appointment-uuid-2',
                                status: 'CONFIRMED',
                                slot_duration: 20,
                                patient_name: 'Jane Smith',
                                appointment_date: '2026-02-03',
                                start_time: '10:15',
                                end_time: '10:35',
                                clinic_name: null,
                                clinic_address: null
                            }
                        ],
                        message: {
                            en: "Doctor's schedule retrieved successfully",
                            ar: "تم استرجاع جدول الطبيب بنجاح"
                        }
                    }
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized - invalid or missing token'
                }
                #swagger.responses[400] = {
                    description: 'Bad request (should rarely happen here)'
                }
            */
            AuthMiddleware,
            this.appointmentController.getCurrentDoctorSchedule
        );
    }
}
