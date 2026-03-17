# GP

## System Architecture (Demo-Slide Friendly)

```mermaid
flowchart LR
    subgraph Clients
        P[Patient App]
        D[Doctor App]
        N[Nurse App]
        A[Admin/SuperAdmin App]
    end

    subgraph Backend["Backend API (Node.js + Express + TypeScript)"]
        R[Route Layer]
        S[Service Layer]
        Q[Queue & Scheduler]
        SEC[Auth + Permissions + Validation]
        WS[Socket.IO Realtime]
    end

    subgraph Data["Core Data & Records"]
        DB[(MySQL via Prisma)]
        ENC[Encryption Service]
        BAK[Backup Service]
    end

    subgraph ChainStorage["Blockchain + Decentralized Storage"]
        FAB[Hyperledger Fabric]
        IPFS[IPFS / Pinata]
    end

    subgraph Integrations["External Integrations"]
        AI[Groq AI Services]
        G[Google OAuth]
        EMAIL[Nodemailer]
        S3[AWS S3 / Cloudinary]
    end

    P --> R
    D --> R
    N --> R
    A --> R

    R --> SEC
    R --> S
    S --> DB
    S --> ENC
    S --> Q
    S --> WS
    S --> FAB
    S --> IPFS
    S --> AI
    S --> G
    S --> EMAIL
    S --> S3
    BAK --> DB
```

### Quick Read (for speaking over the slide)
- **Users (patients, nurses, doctors, admins)** call the backend API.
- The backend enforces **authentication, authorization, and validation**, then runs business logic in services.
- Clinical data is stored in **MySQL (Prisma)** with supporting encryption and backup workflows.
- Trust-sensitive records are anchored through **Hyperledger Fabric**, with large artifacts handled through **IPFS/Pinata**.
- The backend also integrates with **AI**, **Google OAuth**, **email**, and **file storage** services.
