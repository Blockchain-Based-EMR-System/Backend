import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'My API',
    description: 'Description',
  },
  host: 'localhost:3000',
  schemes: ['http'],
  tags: [
    { name: 'Auth', description: 'Authentication and account endpoints' },
    { name: 'Admin', description: 'Admin endpoints' },
    { name: 'Super Admin', description: 'Super Admin endpoints' },
    { name: 'MedicalRecords', description: 'Hyperledger Fabric medical record endpoints' },
  ],
  
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./src/routes/auth.route.ts', './src/routes/fabric.route.ts', './src/routes/admin.route.ts',
    './src/routes/superAdmin.route.ts' , './src/routes/doctors.route.ts'];

swaggerAutogen()(outputFile, endpointsFiles, doc);