import { Routes } from "@/interfaces";
import { Router } from "express";
import { ClinicController } from "@/controllers/clinic.controller";
import { DoctorController } from "@/controllers/doctor.controller";
import { AppointmentController } from "@/controllers/appointment.controller";
import { ValidationMiddleware } from "@/middlewares/validation.middleware";
import { AuthMiddleware } from "@/middlewares/auth.middleware";
import { BookAppointmentDto, RescheduleAppointmentDto, RescheduleAppointmentByDoctorDto, EnterDoctorScheduleDto, EditDoctorScheduleDto, HandleDoctorVacationDto } from "@/dtos/appointments.dto";

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
            `${this.path}/doctors`,
            /* 
                #swagger.path = '/appointments/doctors'
                #swagger.method = 'get'
                #swagger.tags = ['Appointments']
                #swagger.description = 'Get all doctors available for booking appointments'
                #swagger.parameters['gender'] = {
                    in: 'query',
                    description: 'Filter doctors by gender (MALE or FEMALE)',
                    required: false,
                    type: 'string'
                }
                #swagger.parameters['minFees'] = {
                    in: 'query',
                    description: 'Minimum fees filter',
                    required: false,
                    type: 'number'
                }
                #swagger.parameters['maxFees'] = {
                    in: 'query',
                    description: 'Maximum fees filter',
                    required: false,
                    type: 'number'
                }
                #swagger.parameters['isOnline'] = {
                    in: 'query',
                    description: 'Filter for online availability (true for online, false for offline)',
                    required: false,
                    type: 'boolean'
                }
                #swagger.responses[200] = {
                    description: 'Doctors retrieved successfully',
                    schema: {
                        data: [
                            {
                                id: 'doctor-uuid',
                                name: 'John Doe',
                                gender: 'MALE',
                                age: 45,
                                specialization: 'IMMUNOLOGY',
                                phone: '+1234567890',
                                fees: 200,
                                profilePic: 'https://res.cloudinary.com/deh1n7kqj/image/upload/v1770577124/DOCTORS/profile_pictures/DOCTOR_102ef1ca-3084-41f3-a225-1058e7059ee8_profile_picture_1770577124527.jpg',
                                clinics: [
                                    {
                                        id: 'clinic-uuid',
                                        name: 'New Cairo Medical Clinic',
                                        phone: '+1234567890',
                                        canPayOnline: true,
                                        opening_at: '09:00',
                                        closing_at: '17:00',
                                        address: '123 Main Street, Medical Park',
                                        address_maps_link: 'https://maps.google.com/?q=123+Main+Street'
                                    }
                                ]
                            }
                        ],
                        messageEn: 'Doctors retrieved successfully',
                        messageAr: 'تم استرجاع الأطباء بنجاح'
                    }
                }
                #swagger.responses[400] = {
                    description: 'Bad request'
                }
            */
            this.doctorController.getDoctors
        );

        // get all clinics
        this.router.get(
            `${this.path}/clinics`,
            /* 
                #swagger.path = '/appointments/clinics'
                #swagger.method = 'get'
                #swagger.tags = ['Appointments']
                #swagger.description = 'Get all clinics available for booking appointments'
                #swagger.parameters['canPayOnline'] = {
                    in: 'query',
                    description: 'Filter clinics by online payment availability',
                    required: false,
                    type: 'boolean'
                }
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

        // get all doctors in a clinic
        this.router.get(
            `${this.path}/clinic/:clinicId/doctors`,
            /* 
                #swagger.path = '/appointments/clinic/{clinicId}/doctors'
                #swagger.method = 'get'
                #swagger.tags = ['Appointments']
                #swagger.description = 'Get all doctors in a specific clinic'
                #swagger.parameters['clinicId'] = {
                    in: 'path',
                    description: 'Clinic ID',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['gender'] = {
                    in: 'query',
                    description: 'Filter doctors by gender (MALE or FEMALE)',
                    required: false,
                    type: 'string'
                }
                #swagger.parameters['minFees'] = {
                    in: 'query',
                    description: 'Minimum fees filter',
                    required: false,
                    type: 'number'
                }
                #swagger.parameters['maxFees'] = {
                    in: 'query',
                    description: 'Maximum fees filter',
                    required: false,
                    type: 'number'
                }
                #swagger.responses[200] = {
                    description: 'Clinic doctors retrieved successfully',
                    schema: {
                        data: [
                            {
                                id: 'doctor-uuid',
                                name: 'John Doe',
                                gender: 'MALE',
                                age: 45,
                                specialization: 'IMMUNOLOGY',
                                phone: '+1234567890',
                                fees: 200,
                                profilePic: 'https://res.cloudinary.com/deh1n7kqj/image/upload/v1770577124/DOCTORS/profile_pictures/DOCTOR_102ef1ca-3084-41f3-a225-1058e7059ee8_profile_picture_1770577124527.jpg',
                            }
                        ],
                        messageEn: 'Clinic doctors retrieved successfully',
                        messageAr: 'تم استرجاع أطباء العيادة بنجاح'
                    }
                }
                #swagger.responses[400] = {
                    description: 'Bad request'
                }
            */
            this.clinicController.getClinicDoctors
        );

        // get available days
        this.router.get(
            `${this.path}/doctor/:doctorId/available-days`,
            /* 
                #swagger.path = '/appointments/doctor/{doctorId}/available-days'
                #swagger.method = 'get'
                #swagger.tags = ['Appointments']
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
            */
            this.appointmentController.getAvailableDays
        );

        // get all available slots 
        this.router.get(
            `${this.path}/doctor/:doctorId/available-slots`,
            /* 
                #swagger.path = '/appointments/doctor/{doctorId}/available-slots'
                #swagger.method = 'get'
                #swagger.tags = ['Appointments']
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
            */
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
                #swagger.summary = 'Get all appointments for the patient today'
                #swagger.description = 'Returns all appointments scheduled for today for the patient'
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication (patient role required)',
                    required: true,
                    type: 'string'
                }
                #swagger.responses[200] = {
                    description: 'Today\'s appointments retrieved successfully',
                    schema: {
                        success: true,
                        data: [
                            {
                                id: 'appointment-uuid-1',
                                status: 'CONFIRMED',
                                is_online: true,
                                slot_duration: 30,
                                doctor_name: 'Dr. House',
                                appointment_date: '2026-02-05',
                                start_time: '09:00',
                                end_time: '09:30',
                                clinic_name: 'New Cairo Medical Clinic',
                                clinic_address: '123 Main Street, Medical Park',
                                position: 5,
                                estimatedWaitMinutes: 60,
                                patientsAhead: 3
                            },
                            {
                                id: 'appointment-uuid-2',
                                status: 'CONFIRMED',
                                is_online: false,
                                slot_duration: 20,
                                doctor_name: 'Dr. Wilson',
                                appointment_date: '2026-02-05',
                                start_time: '14:30',
                                end_time: '14:50',
                                clinic_name: 'Downtown Clinic',
                                clinic_address: '456 Nile Corniche',
                                position: null,
                                estimatedWaitMinutes: null,
                                patientsAhead: null
                            }
                        ]
                    }
                }
                #swagger.responses[400] = {
                    description: 'Bad request (invalid authentication or missing required fields)',
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized - missing or invalid authentication token',
                }
                #swagger.responses[403] = {
                    description: 'Forbidden - user is not authorized as a patient',
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
            `${this.path}/doctor/upcomming-schedule`,
            /* 
                #swagger.path = '/appointments/doctor/upcomming-schedule'
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
            this.appointmentController.getUpcommingDoctorSchedule
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
                #swagger.description = 'Get the doctor\'s own schedule'
                #swagger.responses[200] = {
                    description: 'Doctor schedule retrieved successfully',
                    schema: {
                        data: [
                            {
                                id: 'schedule-uuid',
                                clinicId: 'clinic-uuid (optional)',
                                dayOfWeek: 'MONDAY',
                                startTime: '09:00',
                                endTime: '17:00',
                                slotDuration: 30,
                                bufferTime: 5,
                                isOnline: true,
                                isActive: true,
                                breakStart: null,
                                breakEnd: null
                            }
                        ],
                        message: 'Doctor schedule retrieved successfully'
                    }
                }
                #swagger.responses[400] = {
                    description: 'Bad request - doctor ID missing'
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized - doctor not authenticated'
                }
            */
            AuthMiddleware,
            this.appointmentController.getDoctorSchedule
        );

        this.router.patch(
            `${this.path}/doctor/schedule`,
            /* 
                #swagger.path = '/appointments/doctor/schedule'
                #swagger.method = 'patch'
                #swagger.tags = ['Appointments']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication (must be a doctor)',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Edit a specific entry in the doctor\'s schedule'
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Schedule edit details (all fields optional except scheduleId)',
                    required: true,
                    schema: {
                        scheduleId: 'schedule-uuid',
                        clinicId: 'clinic-uuid (optional)',
                        workingDay: 1,
                        startTime: '09:00',
                        endTime: '17:00',
                        slotDuration: 30,
                        bufferTime: 5,
                        isOnline: true,
                        isActive: false,
                        breakStart: '2026-02-01',
                        breakEnd: '2026-02-22'
                    }
                }
                #swagger.responses[200] = {
                    description: 'Schedule updated successfully',
                    schema: {
                        message: 'Schedule updated successfully'
                    }
                }
                #swagger.responses[400] = {
                    description: 'Bad request - invalid parameters or conflict'
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized - doctor not authenticated'
                }
                #swagger.responses[403] = {
                    description: 'Forbidden - schedule does not belong to the doctor'
                }
                #swagger.responses[404] = {
                    description: 'Schedule not found'
                }
            */
            AuthMiddleware,
            ValidationMiddleware(EditDoctorScheduleDto),
            this.appointmentController.editDoctorSchedule
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
                    description: 'Bad request'
                }
            */
            AuthMiddleware,
            this.appointmentController.getCurrentDoctorSchedule
        );

        this.router.get(
            `${this.path}/doctor/daily-schedule`,
            /* 
                #swagger.path = '/appointments/doctor/daily-schedule'
                #swagger.method = 'get'
                #swagger.tags = ['Appointments']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication (must be a doctor)',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Get all doctor appointments for a specific date'
                #swagger.parameters['date'] = {
                    in: 'query',
                    description: 'Date in YYYY-MM-DD format',
                    required: true,
                    type: 'string'
                }
                #swagger.responses[200] = {
                    description: 'Daily schedule retrieved successfully',
                    schema: {
                        data: [
                            {
                                id: 'appointment-uuid',
                                status: 'CONFIRMED',
                                slot_duration: 30,
                                patient_name: 'John Sink',
                                appointment_date: '2026-02-05',
                                start_time: '09:00',
                                end_time: '09:30',
                                clinic_name: 'New Cairo Medical Clinic',
                                clinic_address: '123 Main Street, Medical Park'
                            },
                            {
                                id: 'appointment-uuid-2',
                                status: 'COMPLETED',
                                slot_duration: 20,
                                patient_name: 'Jane Hopper',
                                appointment_date: '2026-02-05',
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
                #swagger.responses[400] = {
                    description: 'Bad request - missing or invalid date parameter, or invalid date format'
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized - doctor not authenticated'
                }
            */
            AuthMiddleware,
            this.appointmentController.getScheduleByDate
        );

        this.router.get(
            `${this.path}/doctor/schedule/check-appointments`,
            /* 
                #swagger.path = '/appointments/doctor/schedule/check-appointments'
                #swagger.method = 'get'
                #swagger.tags = ['Appointments']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication (must be a doctor)',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Check for existing confirmed appointments in a doctor schedule'
                #swagger.parameters['scheduleId'] = {
                    in: 'query',
                    description: 'Schedule ID to check',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['startDate'] = {
                    in: 'query',
                    description: 'Optional for vacation. format: YYYY-MM-DD',
                    required: false,
                    type: 'string'
                }
                #swagger.parameters['endDate'] = {
                    in: 'query',
                    description: 'Optional for vacation. format: YYYY-MM-DD',
                    required: false,
                    type: 'string'
                }
                #swagger.responses[200] = {
                    description: 'Check completed successfully',
                    schema: {
                        data: {
                            existing: true,
                            numOfAppointments: 3
                        },
                        message: 'Check completed successfully'
                    }
                }
                #swagger.responses[400] = {
                    description: 'Bad request - missing/invalid parameters'
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized - doctor not authenticated'
                }
                #swagger.responses[403] = {
                    description: 'Forbidden - schedule does not belong to the doctor'
                }
                #swagger.responses[404] = {
                    description: 'Schedule not found'
                }
            */
            AuthMiddleware,
            this.appointmentController.checkConflictingAppointments 
        );

        this.router.patch(
            `${this.path}/doctor/vacation`,
            /* 
                #swagger.path = '/appointments/doctor/vacation'
                #swagger.method = 'patch'
                #swagger.tags = ['Appointments']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication (must be a doctor)',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Set vacation period for a specific doctor schedule. This will automatically cancel any existing confirmed appointments in the period (use vacation-check first to warn the doctor)'
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Vacation details',
                    required: true,
                    schema: {
                        scheduleId: 'schedule-uuid',
                        startDate: '2026-03-01',
                        endDate: '2026-03-15'
                    }
                }
                #swagger.responses[200] = {
                    description: 'Vacation set successfully (any conflicting appointments cancelled)'
                }
                #swagger.responses[400] = {
                    description: 'Bad request - invalid dates or date range'
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized - doctor not authenticated'
                }
                #swagger.responses[403] = {
                    description: 'Forbidden - schedule does not belong to the doctor'
                }
                #swagger.responses[404] = {
                    description: 'Schedule not found'
                }
            */
            AuthMiddleware,
            ValidationMiddleware(HandleDoctorVacationDto),
            this.appointmentController.handleDoctorVacation
        );

        this.router.delete(
            `${this.path}/doctor/schedule/delete`,
            /* 
                #swagger.path = '/appointments/doctor/schedule/delete'
                #swagger.method = 'delete'
                #swagger.tags = ['Appointments']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication (must be a doctor)',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Delete a doctor\'s schedule. If there are any appointments linked to this schedule, they will be automatically cancelled'
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Schedule deletion payload',
                    required: true,
                    schema: {
                        scheduleId: 'schedule-uuid'
                    }
                }
                #swagger.responses[200] = {
                    description: 'Schedule successfully deleted (any associated confirmed appointments were cancelled)',
                    schema: {
                        success: true,
                        message: {
                            en: "Schedule deleted successfully",
                            ar: "تم حذف الجدول بنجاح"
                        }
                    }
                }
                #swagger.responses[400] = {
                    description: 'Bad request - missing scheduleId in body or invalid request'
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized - missing or invalid token'
                }
                #swagger.responses[403] = {
                    description: 'Forbidden - schedule does not belong to the authenticated doctor'
                }
                #swagger.responses[404] = {
                    description: 'Schedule not found'
                }
            */
            AuthMiddleware,
            this.appointmentController.deleteDoctorSchedule
        );

        this.router.get(
            `${this.path}/doctor/vacation`,
            /* 
                #swagger.path = '/appointments/doctor/vacation'
                #swagger.method = 'get'
                #swagger.tags = ['Appointments']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication (must be a doctor)',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Get all vacation periods for the doctor, grouped by schedule with details including affected appointments'
                #swagger.responses[200] = {
                    description: 'Doctor vacations retrieved successfully',
                    schema: {
                        data: [
                            {
                                breakStart: '2026-03-01',
                                breakEnd: '2026-03-15',
                                vacations: [
                                    {
                                        vacationId: 'vacation-uuid',
                                        scheduleId: 'schedule-uuid',
                                        clinicId: 'clinic-uuid',
                                        clinicName: 'New Cairo Medical Clinic',
                                        clinicAddress: '123 Main Street, Medical Park',
                                        dayOfWeek: 'MONDAY',
                                        isOnline: false,
                                        status: 'ACTIVE',
                                        cancelledAppointments: 5
                                    },
                                    {
                                        vacationId: 'vacation-uuid-2',
                                        scheduleId: 'schedule-uuid-2',
                                        clinicId: null,
                                        clinicName: null,
                                        clinicAddress: null,
                                        dayOfWeek: 'WEDNESDAY',
                                        isOnline: true,
                                        status: 'ACTIVE',
                                        cancelledAppointments: 2
                                    }
                                ]
                            }
                        ],
                        message: {
                            en: "Doctor's vacations retrieved successfully",
                            ar: "تم استرجاع إجازات الطبيب بنجاح"
                        }
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
            this.appointmentController.getDoctorVacations
        );

        this.router.patch(
            `${this.path}/doctor/vacation/cancel`,
            /* 
                #swagger.path = '/appointments/doctor/vacation/cancel'
                #swagger.method = 'patch'
                #swagger.tags = ['Appointments']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication (must be a doctor)',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Cancel a specific vacation period for a doctor schedule'
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Vacation cancellation details',
                    required: true,
                    schema: {
                        vacationId: 'vacation-uuid',
                        scheduleId: 'schedule-uuid'
                    }
                }
                #swagger.responses[200] = {
                    description: 'Vacation removed successfully',
                }
                #swagger.responses[400] = {
                    description: 'Bad request - missing vacationId or scheduleId, or invalid parameters'
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized - doctor not authenticated'
                }
                #swagger.responses[403] = {
                    description: 'Forbidden - vacation or schedule does not belong to the doctor'
                }
                #swagger.responses[404] = {
                    description: 'Vacation or schedule not found'
                }
            */
            AuthMiddleware,
            this.appointmentController.cancelDoctorVacation
        );
    }
}
