# Business Rules — Blockchain-Based EMR System (Backend)

This document defines the clear, testable constraints that govern the system's behavior. Rules are grouped into three categories: **Validation Rules**, **Permission Constraints**, and **Operational Restrictions**.

---

## Table of Contents

1. [User Accounts & Authentication](#1-user-accounts--authentication)
2. [Doctor Accounts](#2-doctor-accounts)
3. [Nurse Accounts](#3-nurse-accounts)
4. [Patient Accounts](#4-patient-accounts)
5. [Clinics](#5-clinics)
6. [Doctor Schedules](#6-doctor-schedules)
7. [Appointments](#7-appointments)
8. [Nurse Recruitment (Announcements)](#8-nurse-recruitment-announcements)
9. [Medical Records](#9-medical-records)
10. [Medications & Scans/Labs](#10-medications--scanslabs)
11. [Vacations](#11-vacations)
12. [Video Calls (Agora)](#12-video-calls-agora)
13. [Permission Summary by Role](#13-permission-summary-by-role)

---

## 1. User Accounts & Authentication

### Validation Rules

- **Email** must be a valid email address and must be unique across all users.
- **Username** must be unique across all users.
- **Password** must be at least **8 characters** and at most **32 characters** long.
- **Date of birth** must be a valid date string (ISO 8601 format).
- **Gender** must be one of the allowed values (`MALE`, `FEMALE`).
- **Phone number** must be provided and must not be empty.
- **OTP (One-Time Password)** must be valid and must not be expired. OTPs expire after **10 minutes**.
- **Password reset tokens** expire after **10 minutes**.

### Permission Constraints

- Any user (guest) can register as a **Patient** only. Registration as Doctor or Nurse goes through separate flows.
- Only authenticated users (with a valid JWT token) can access protected endpoints.
- The system extracts the JWT token from either the `Authorization` cookie or the `Authorization: Bearer <token>` header.

### Operational Restrictions

- **Access tokens** expire after **1 hour** (configurable via environment variable).
- **Refresh tokens** expire after **7 days** (configurable via environment variable).
- On logout, **all active refresh tokens** for the user are revoked.
- A user's email is verified through an **OTP sent by email**. Unverified accounts have limited access.
- A user must **complete their profile** (provide gender and date of birth) before using core features.
- **Google OAuth** users must additionally provide a phone number to complete their profile.
- A new password set through the reset flow must meet the same 8–32 character requirement.

---

## 2. Doctor Accounts

### Validation Rules

- **Name**, **email**, **phone**, **password**, and **gender** are all required at registration.
- The following **certificate files** are required at registration:
  - Graduation Certificate
  - Membership Card
  - Professional Practice Card
  - Masters Certificate
  - Fellowship Certificate
  - Union Specialization Certificate
- Certificate files must be uploaded as **PDF** files only.
- Profile pictures must be **JPEG or PNG** images only.
- **Specialization** must be one of the 18 recognized types: Cardiology, Dermatology, Endocrinology, Gastroenterology, General Practice, Gynecology, Hematology, Internal Medicine, Nephrology, Neurology, Neurosurgery, Obstetrics, Oncology, Orthopedics, Otolaryngology, Pediatrics, Psychiatry, Urology.
- **Availability type** must be one of: `UNSET`, `ONLINE`, `OFFLINE`, `BOTH`.

### Permission Constraints

- A **Doctor** account created through the public sign-up endpoint starts with an `PENDING` status and must be **approved by an Admin** before the doctor can log in.
- A Doctor account created directly **by an Admin** bypasses the approval workflow (is created as `APPROVED`).
- Only a **Doctor** (the owner) can create, update, or delete their own clinic schedules, clinics, and announcements.
- Only a **Doctor** can post nurse recruitment announcements.
- Only the **creating Doctor** of a clinic can update or delete that clinic.

### Operational Restrictions

- A Doctor whose account status is **not** `APPROVED` **cannot log in**.
- A Doctor can create a **maximum of 3 clinics**.
- A Doctor's password can only be set **once** via the `set-password` endpoint; if already set, the request is rejected.

---

## 3. Nurse Accounts

### Validation Rules

- **Name**, **email**, **phone**, **password**, **gender**, and **years of experience** are required at registration.
- **Years of experience** must be a whole number (integer), greater than or equal to 0.
- A **National ID card image** (JPEG or PNG) is required at registration.
- An optional **bonus file** (JPEG, PNG, or PDF) may be uploaded.
- A short professional **bio** (`brief`) is optional.

### Permission Constraints

- A **Nurse** account created through the public sign-up endpoint starts with `PENDING` status and must be **approved by an Admin** before the nurse can log in.
- A Nurse account created directly **by an Admin** bypasses the approval workflow.
- Only a **Nurse** can set their own working schedule and manage their own appointments.
- Only the **assigned Nurse** can mark a patient appointment as complete.

### Operational Restrictions

- A Nurse whose account status is **not** `APPROVED` **cannot log in**.
- A Nurse can **apply to an announcement only once** per announcement.
- A Nurse **cannot apply** to an announcement that has **expired**.
- A Nurse's password can only be set **once** via the `set-password` endpoint; if already set, the request is rejected.

---

## 4. Patient Accounts

### Validation Rules

- **Name**, **email**, **phone**, **password**, and `rememberMe` flag are required at registration.
- Patient accounts are created with `consent = false` and an empty blockchain address (`bc_address`) by default.

### Permission Constraints

- Only an authenticated **Patient** can view and manage their own appointments and medical records.
- Only the **Patient themselves** can book or cancel their own appointments.

### Operational Restrictions

- Patients are registered immediately as active (no approval required).
- A Patient must **complete their profile** (provide gender and date of birth) to use core features.
- Sharing medical records on the blockchain requires the patient to have a **blockchain address** set and **consent** given.

---

## 5. Clinics

### Validation Rules

- **Name**, **address**, **phone**, **opening time** (`opening_at`), **closing time** (`closing_at`), and **fees** are all required when creating or updating a clinic.
- `opening_at` and `closing_at` must be in **HH:MM** format (24-hour clock, e.g., `09:00`, `17:30`).
- **Fees** must be a number.
- An optional **Google Maps link** (`address_maps_link`) may be provided.
- The `canPayOnline` flag is optional (defaults to false if not provided).

### Permission Constraints

- Only a **Doctor** can create a clinic.
- Only the **Doctor who created** a clinic can update or delete it.
- Only an **Admin** can activate or deactivate a clinic (`is_active` status).

### Operational Restrictions

- A newly created clinic is **inactive by default** (`is_active = false`) until an Admin activates it.
- A Doctor can create a **maximum of 3 clinics** in total. Attempting to create a 4th clinic is rejected.

---

## 6. Doctor Schedules

### Validation Rules

- **Working day** must be an integer from **0 (Sunday) to 6 (Saturday)**.
- **Start time** and **end time** must be provided as strings in **HH:MM** format.
- **End time must be after start time**. A schedule where end time is the same as or earlier than start time is rejected.
- **Slot duration** must be an integer (in minutes).
- **Buffer time** (break between appointments) must be an integer (in minutes), defaults to **0** if not provided.
- **Break start** and **break end** (optional lunch break) must also be in **HH:MM** format if provided.
- A schedule must be either **online** (`isOnline = true`) or **offline** (`isOnline = false`), linked to a clinic.

### Permission Constraints

- Only the **Doctor** who owns a schedule can create, edit, or delete it.
- A Doctor can only add a schedule for a clinic they are **associated with**.
- A Doctor cannot add an **online schedule** linked to a clinic (clinics are always offline).
- A Doctor cannot add an **offline schedule without specifying a clinic**.

### Operational Restrictions

- A Doctor **cannot have two schedules for the same day and the same clinic** — duplicates are rejected.
- A Doctor **cannot have overlapping time blocks** for the same day across different clinics.
- A Doctor **cannot mix online and offline** for the same working day (conflict check prevents this).

---

## 7. Appointments

### Validation Rules

- **Doctor ID** is required when booking an appointment.
- **Scheduled time** must be a valid ISO 8601 date-time string.
- **Date** for slot queries must be in **YYYY-MM-DD** format.
- For **offline appointments**, a **Clinic ID is required**. Attempting to book an offline appointment without a clinic ID is rejected.
- The `newScheduledTime` for patient rescheduling must be a valid ISO 8601 date-time string.
- The `minutes` offset for doctor rescheduling must be a number and **must not exceed 60 minutes**.

### Permission Constraints

- Only an authenticated **Patient** can book an appointment.
- Only the **Patient who owns** an appointment can reschedule or cancel it.
- Only the **Doctor who owns** an appointment can reschedule it using the minutes-offset method.
- Only the **assigned Nurse** or the Doctor can mark an appointment as complete.
- Only the patient or doctor linked to an appointment can access its details.
- Only a participant of the appointment (patient or doctor) can generate the **Agora video call token** for that appointment.

### Operational Restrictions

- Appointments **cannot be booked in the past**.
- Appointments **cannot be double-booked** — if the requested time slot is already taken, the booking is rejected.
- The appointment booking window is **30 days ahead** from today.
- The system only shows time slots that are within the doctor's working hours and not already booked.
- A doctor's **vacation period blocks all appointments** for those dates.
- Appointments in `CANCELLED` or `COMPLETED` status cannot be rescheduled.
- When a Doctor reschedules using the minutes offset, **all confirmed appointments from that point forward** are shifted by the same number of minutes.
- An appointment **cannot be marked complete before its scheduled time**.
- An appointment that has already been **cancelled or deleted** cannot be cancelled again.
- Appointment status flow: `CONFIRMED` → `COMPLETED` | `CANCELLED` | `NO_SHOW`.
- An **Agora video call token** expires after **1 hour**.

---

## 8. Nurse Recruitment (Announcements)

### Validation Rules

- **Clinic ID** and a list of **working days** (each with `day_of_week`, `start_time`, `end_time`) are required when posting an announcement.
- `day_of_week` in a working day must be a valid `DayOfWeek` enum value.
- `start_time` and `end_time` for working days must be provided as strings.
- Optional filters on an announcement: **gender** (must be a valid `Gender` enum), **max age** (integer ≥ 0), **years of experience** (integer ≥ 0), **notes** (string).

### Permission Constraints

- Only a **Doctor** can create, edit, delete, or manage announcements.
- Only the **Doctor who created** an announcement can approve or reject applicants.
- Only a **Nurse** can apply to an announcement.

### Operational Restrictions

- A Nurse **cannot apply to the same announcement more than once**.
- A Nurse **cannot apply to an expired announcement**.
- An application that has already been **approved or rejected** cannot be processed again.
- Announcement applicant status flow: `PENDING` → `APPROVED` | `REJECTED`.

---

## 9. Medical Records

### Validation Rules

- **Record name** and **record type** are required when creating a medical record.
- **Record type** must be one of: `LAB_RESULT`, `SCAN`, `DIAGNOSIS`, `VISIT_SUMMARY`.
- An optional **Doctor ID** (`doctor_id`) may be associated with the record.
- When filtering records, the optional `type` filter must be a valid `RecordType` value.

### Permission Constraints

- Only authenticated users can create or view medical records.
- A Patient can only view **their own** medical records.
- Medical records stored on the **blockchain** require the patient to have a blockchain address and have given consent.

### Operational Restrictions

- Medical records are stored on **IPFS** and referenced with an audit trail on **Hyperledger Fabric** for immutability.
- A blockchain address must be set on the Patient profile before any blockchain-based record operations can proceed.

---

## 10. Medications & Scans/Labs

### Validation Rules

- Medications must have a **start date**, **end date**, **frequency**, and **period**.
- **Period** must be one of: `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`.
- Scans and labs must specify a **type**: `SCAN` or `LAB`.

### Permission Constraints

- Only a **Doctor** can prescribe (create) medications or schedule scans/labs for a patient.
- Patients can only **view** their own medications and scan/lab orders.

### Operational Restrictions

- Medication start date must be before end date.

---

## 11. Vacations

### Validation Rules

- **Schedule ID**, **start date**, and **end date** are all required when setting a vacation.
- **Start date** and **end date** must be valid ISO 8601 date strings.
- **End date must be after start date**. Invalid date ranges are rejected.

### Permission Constraints

- Only the **Doctor who owns** the schedule can set or cancel vacations on it.
- Only the **Doctor** can access their own schedule's vacation details.

### Operational Restrictions

- Vacation status is managed automatically by a **daily cron job**:
  - `UPCOMING` → `CURRENT` (when the start date is reached)
  - `CURRENT` → `ENDED` (when the end date passes)
- While a vacation is **CURRENT** or **UPCOMING**, the affected schedule's days are blocked and no appointments can be booked for those dates.

---

## 12. Video Calls (Agora)

### Validation Rules

- Agora **App ID** and **App Certificate** must be configured in the environment. Requests fail if these are missing.

### Permission Constraints

- Only a **participant of the appointment** (the patient or the doctor) can request an Agora token for that appointment.

### Operational Restrictions

- Agora tokens are valid for **1 hour** from the time of generation.
- Tokens are generated per appointment (the appointment ID is used as the channel name).

---

## 13. Permission Summary by Role

| Action | SUPER_ADMIN | ADMIN | DOCTOR | NURSE | PATIENT |
|---|---|---|---|---|---|
| Create Admin accounts | ✅ | ❌ | ❌ | ❌ | ❌ |
| List all Admins / Doctors / Nurses / Patients | ✅ | ❌ | ❌ | ❌ | ❌ |
| Change any user's status | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Doctor / Nurse accounts | ❌ | ✅ | ❌ | ❌ | ❌ |
| Approve / reject Doctor accounts | ❌ | ✅ | ❌ | ❌ | ❌ |
| Approve / reject Nurse accounts | ❌ | ✅ | ❌ | ❌ | ❌ |
| Activate / deactivate clinics | ❌ | ✅ | ❌ | ❌ | ❌ |
| View all clinics | ❌ | ✅ | ❌ | ❌ | ❌ |
| Create a clinic | ❌ | ❌ | ✅ (own, max 3) | ❌ | ❌ |
| Update / delete own clinic | ❌ | ❌ | ✅ (owner only) | ❌ | ❌ |
| Set own working schedule | ❌ | ❌ | ✅ | ❌ | ❌ |
| Post nurse recruitment announcements | ❌ | ❌ | ✅ | ❌ | ❌ |
| Approve / reject nurse applicants | ❌ | ❌ | ✅ (own announcement) | ❌ | ❌ |
| Set own working schedule (nurse) | ❌ | ❌ | ❌ | ✅ | ❌ |
| Apply to announcements | ❌ | ❌ | ❌ | ✅ | ❌ |
| Mark appointment complete | ❌ | ❌ | ✅ | ✅ | ❌ |
| Book an appointment | ❌ | ❌ | ❌ | ❌ | ✅ |
| Cancel / reschedule own appointment | ❌ | ❌ | ❌ | ❌ | ✅ (own only) |
| Reschedule appointment (minutes offset) | ❌ | ❌ | ✅ (own only) | ❌ | ❌ |
| View own appointments | ❌ | ❌ | ✅ | ✅ | ✅ |
| View / add own medical records | ❌ | ❌ | ❌ | ❌ | ✅ |
| Prescribe medications / schedule scans | ❌ | ❌ | ✅ | ❌ | ❌ |
| View own medications / scans | ❌ | ❌ | ❌ | ❌ | ✅ |
| Set vacations | ❌ | ❌ | ✅ (own schedule) | ❌ | ❌ |
| Generate Agora video token | ❌ | ❌ | ✅ (own appointments) | ❌ | ✅ (own appointments) |

> **Note:** All protected actions require a valid JWT token. Unauthenticated requests to any protected endpoint are rejected with HTTP 401.

---

## File Upload Rules (Summary)

| File Type | Allowed Formats |
|---|---|
| Doctor certificate files (graduation, membership, etc.) | PDF only |
| Nurse National ID card | JPEG, PNG |
| Nurse bonus file | JPEG, PNG, PDF |
| Profile pictures (all roles) | JPEG, PNG |

---

*Document generated from codebase analysis. Last updated: 2026-03-07.*
