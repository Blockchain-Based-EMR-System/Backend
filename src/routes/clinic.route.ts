import { ClinicController } from "@/controllers/clinic.controller";
import {  CreateUpdateClinicRequestDto } from "@/dtos/clinics.dto";
import { Routes } from "@/interfaces";
import { AuthMiddleware, RoleMiddleware } from "@/middlewares/auth.middleware";
import { ValidationMiddleware } from "@/middlewares/validation.middleware";
import { Role } from "@prisma/client";
import { Router } from "express";

export class ClinicRoute implements Routes {
    public path = '/clinics'
    public router = Router();
    public clinicController = new ClinicController();
    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(
            `${this.path}`,
            /* 
                #swagger.path = '/clinics'
                #swagger.method = 'post'
                #swagger.tags = ['Clinics']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Clinic creation data',
                    required: true,
                    schema: {
                        $name: 'Downtown Medical Clinic',
                        $opening_at: '09:00',
                        $closing_at: '17:00',
                        $address: '123 Main Street, City Center',
                        address_maps_link: 'https://maps.google.com/?q=123+Main+Street',
                        $phone: '+1234567890',
                        canPayOnline: true,
                        $fees: 100
                    }
                }
                #swagger.responses[201] = {
                    description: 'Clinic created successfully',
                    schema: {
                        message: 'Clinic created successfully'
                    }
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.DOCTOR),
            ValidationMiddleware(CreateUpdateClinicRequestDto),
            this.clinicController.createClinic
        );

        this.router.get(
            `${this.path}/:id`,
            /* 
                #swagger.path = '/clinics/{id}'
                #swagger.method = 'get'
                #swagger.tags = ['Clinics']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['id'] = {
                    in: 'path',
                    description: 'The unique identifier of the clinic',
                    required: true,
                    type: 'string'
                }
                #swagger.responses[200] = {
                    description: 'Clinic details retrieved successfully',
                    schema: {
                        data: {
                            id: 'clinic-uuid-123',
                            name: 'Downtown Medical Clinic',
                            is_active: true,
                            opening_at: '09:00',
                            closing_at: '17:00',
                            address: '123 Main Street, City Center',
                            address_maps_link: 'https://maps.google.com/?q=123+Main+Street',
                            phone: '+1234567890',
                            canPayOnline: true,
                            created_at: '2024-01-01T00:00:00.000Z'
                        },
                        message: 'Clinic retrieved successfully'
                    }
                }
            */
            AuthMiddleware, // To be Discussed: Should patients be able to view clinic details?
            this.clinicController.getClinicById
        );

        this.router.patch(
            `${this.path}/:id`,
            /* 
                #swagger.path = '/clinics/{id}'
                #swagger.method = 'patch'
                #swagger.tags = ['Clinics']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['id'] = {
                    in: 'path',
                    description: 'The unique identifier of the clinic to update',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Clinic update data (all fields are optional)',
                    required: true,
                    schema: {
                        name: 'Downtown Medical Clinic - Updated',
                        opening_at: '08:00',
                        closing_at: '18:00',
                        address: '456 New Street, City Center',
                        address_maps_link: 'https://maps.google.com/?q=456+New+Street',
                        phone: '+1234567891',
                        canPayOnline: false,
                        fees: 150
                    }
                }
                #swagger.responses[200] = {
                    description: 'Clinic updated successfully',
                    schema: {
                        message: 'Clinic updated successfully'
                    }
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.DOCTOR),
            ValidationMiddleware(CreateUpdateClinicRequestDto, true),
            this.clinicController.updateClinicById
        );

        this.router.delete(
            `${this.path}/:id`,
            /*
                #swagger.path = '/clinics/{id}'
                #swagger.method = 'delete'
                #swagger.tags = ['Clinics']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['id'] = {
                    in: 'path',
                    description: 'The unique identifier of the clinic to delete',
                    required: true,
                    type: 'string'
                }
                #swagger.responses[200] = {
                    description: 'Clinic deleted successfully',
                    schema: {
                        message: 'Clinic deleted successfully'
                    }
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.DOCTOR),
            this.clinicController.deleteClinicById
        );

        this.router.get(
            `${this.path}`,
            /* 
                #swagger.path = '/clinics'
                #swagger.method = 'get'
                #swagger.tags = ['Clinics']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
                #swagger.responses[200] = {
                    description: 'Get doctor clinics successful',
                    schema: {
                        data: [
                            {
                                id: 'clinic-uuid',
                                name: 'Clinic Name',
                                address: '123 Main St, City, Country',
                                address_maps_link: 'https://maps.google.com/?q=123+Main+St,+City,+Country',
                                phone: '1234567890',
                                opening_at: '09:00',
                                closing_at: '17:00',
                                canPayOnline: true,
                                is_active: true,
                                created_at: '2024-01-01T00:00:00.000Z',
                                fees: 100
                            }
                        ],
                        message: "Doctor's clinics retrieved successfully"
                    }
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.DOCTOR),
            this.clinicController.getDoctorClinics
        );
    }
}