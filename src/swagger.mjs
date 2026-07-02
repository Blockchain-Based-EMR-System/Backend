import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'My API',
    description: 'Description',
  },
  host: 'localhost:3000',
  schemes: ['http'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description: 'Enter your Bearer token: Bearer <token>',
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Auth', description: 'Authentication and account endpoints' },
    { name: 'Admin', description: 'Admin endpoints' },
    { name: 'Super Admin', description: 'Super Admin endpoints' },
    { name: 'MedicalRecords', description: 'Hyperledger Fabric medical record endpoints' },
    { name: 'Doctors', description: 'Doctor account endpoints' },
    { name: 'Clinics', description: 'Clinic endpoints' },
    { name: 'Appointments', description: 'Appointment endpoints' },
    { name: 'Queue', description: 'Queue endpoints' },
    { name: 'Users', description: 'User account endpoints' },
    { name: 'Nurses', description: 'Nurse account endpoints' },
    { name: 'AI Appointments', description: 'AI-generated SOAP notes for appointments' }
  ],
};

const outputFile = './swagger-output.json';
const endpointsFiles = [
  './routes/auth.route.ts',
  './routes/fabric.route.ts',
  './routes/admin.route.ts',
  './routes/superAdmin.route.ts',
  './routes/doctors.route.ts',
  './routes/clinic.route.ts',
  './routes/appointment.route.ts',
  './routes/queue.route.ts',
  './routes/user.route.ts',
  './routes/nurse.route.ts',
  './routes/medical-record.route.ts',
  './routes/ai_appointments.route.ts'
];

swaggerAutogen()(outputFile, endpointsFiles, doc);
