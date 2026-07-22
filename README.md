<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/logoDark.png">
  <source media="(prefers-color-scheme: light)" srcset="assets/logoLight.png">
  <img alt="HoloCura logo" src="assets/logoLight.png" width="220">
</picture>

A blockchain-based Electronic Health Record (EHR) system that links clinics together on a shared, tamper-proof network, enabling secure medical data exchange while keeping patients in full control of who can access and share their records.

</div>


## Core capabilities

- Role-based accounts for patients, doctors, nurses, clinic admins, and super admins
- JWT authentication with refresh tokens, Google OAuth, email OTP verification, and password reset flows
- Clinic and doctor management, including doctor verification documents and specializations
- Appointment booking with schedule/availability lookup and a live queueing system over WebSockets
- Medical records encrypted and stored on IPFS, with content hashes anchored on a Hyperledger Fabric channel
- AI-assisted appointment audio processing 
- File uploads to Cloudinary / S3-compatible storage
- Scheduled jobs for vacations and record backups
- Swagger documentation generated from route annotations

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22, TypeScript |
| Framework | Express 5 |
| ORM / Database | Prisma ORM, PostgreSQL |
| Blockchain | Hyperledger Fabric (`@hyperledger/fabric-gateway`) |
| Distributed storage | IPFS via Pinata |
| Object storage | AWS S3-compatible storage, Cloudinary |
| Auth | JWT, Passport (Google OAuth 2.0), express-session |
| Real-time | Socket.IO |
| Docs | Swagger (autogen + swagger-ui-express) |
| Testing | Jest, Supertest |
| Process management | PM2, Docker, Nginx |

## Project structure

```
src/
├── app.ts                 
├── server.ts              
├── config/                 
├── controllers/            
├── services/                
├── routes/                
├── middlewares/          
├── dtos/                
├── interfaces/          
├── prisma/
│   ├── schema.prisma        
│   └── migrations/       
├── utils/                
└── swagger.mjs             
```

## API surface

All routes are mounted at the application root. Key resource groups:

| Base path | Description |
|---|---|
| `/auth` | Signup, login, refresh, email verification, password reset |
| `/users` | Profile and profile picture management |
| `/doctors` | Doctor onboarding, verification, and profile management |
| `/nurses` | Nurse onboarding, announcements, schedules |
| `/clinics` | Clinic CRUD and configuration |
| `/appointments` | Booking, availability, patient appointment history |
| `/appointments/ai` | AI-assisted appointment audio processing |
| `/queue` | Live queue position lookup |
| `/medical-records` | Visit summaries and medical history |
| `/records` | Blockchain-backed record operations |
| `/admin` | Clinic and platform administration |
| `/super-admin` | Platform-wide administration |


## Getting started

### Prerequisites

- Node.js 22+
- PostgreSQL 16
- Docker and Docker Compose 
- A Hyperledger Fabric network and identity credentials, for blockchain-backed record features
- A Pinata account, for IPFS storage

### Installation

```bash
git clone https://github.com/Blockchain-Based-EMR-System/Backend.git
cd Backend
npm install
```



### Running locally

```bash
npm run dev
```

### Running with Docker

```bash
docker compose up --build
```



## Contributing

Contributions are welcome! To contribute:

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit** your changes
   ```bash
   git commit -m "Add: your feature description"
   ```
4. **Push** to your branch
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open** a Pull Request describing your changes

Please ensure your code follows the existing feature-based architecture and passes linting before submitting a PR.



## Team

| Name | Contact |
|---|---|
| **Kareem Abdel Nabi** | [kareem-abdelnabi.vercel.app](https://kareem-abdelnabi.vercel.app/) |
| **Enjy Ashraf** | [enjyashraf18@gmail.com](mailto:enjyashraf18@gmail.com) |
| **Salah Mohamed** | — |
| **Youssef Aboelella** | — |


### Supervised By

- **Dr. Amira Gaber**
- **Eng. Mohamed Adel**
- **Eng. Khalid Zahra**


## Acknowledgments

Special thanks to our supervisors for their invaluable guidance and support throughout the development of this project.


## Contact

For questions, feedback, or collaboration inquiries, feel free to reach out to any of the team members listed above.
