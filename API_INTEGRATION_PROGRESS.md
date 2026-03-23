# API Integration Progress

This file tracks frontend integration status against the new APIs in `Medrotic.Api/Controllers`.

## Connected

- `AuthController`
  - `POST /api/auth/register-patient`
  - `POST /api/auth/login`
  - `POST /api/auth/forget-password`
  - `POST /api/auth/verify-otp`
  - `POST /api/auth/reset-password`
  - `POST /api/auth/resend-otp`
  - `POST /api/auth/add-user`
  - `GET /api/auth/test-admin`
  - `GET /api/auth/test-doctor`
  - `GET /api/auth/test-patient`
  - Frontend file: `src/app/auth/auth.service.ts`

- `PatientController`
  - `GET /api/patient/profile`
  - `GET /api/patient/records`
  - `POST /api/patient/upload-history`
  - `GET /api/patient/documents`
  - `POST /api/patient/upload-document`
  - `GET /api/patient/notifications`
  - `PUT /api/patient/notifications/{id}/read`
  - `GET /api/patient/analytics`
  - `PUT /api/patient/profile`
  - Frontend file: `src/app/services/patient.service.ts`

- `DoctorController`
  - `GET/PUT /api/doctor/profile`
  - `POST /api/doctor/patients/{patientId}/records` (upload from doctor flows)
  - `GET/PUT/DELETE /api/doctor/patients/{patientId}/records/{recordId}`
  - `PUT /api/doctor/ai-results/{id}/approve`
  - `POST /api/doctor/patients/{patientId}/notifications`
  - `GET /api/doctor/analytics`
  - `GET/POST/PUT/DELETE /api/doctor/appointments`
  - Frontend file: `src/app/services/doctor.service.ts`

- `AdminController`
  - `GET/POST/PUT/DELETE /api/admin/doctors` (list/add/update/delete)
  - `GET/PUT/DELETE /api/admin/patients` (list/update/delete)
  - `GET/POST/GET(id)/PUT/DELETE /api/admin/hospitals`
  - `GET/POST/PUT/DELETE /api/admin/admins`
  - `GET /api/admin/analytics`
  - `GET /api/admin/medical-records`
  - `GET /api/admin/documents`
  - `GET/POST /api/admin/notifications`
  - `PUT /api/admin/notifications/{id}/read`
  - `GET /api/admin/ai-results`
  - `PUT /api/admin/ai-results/{id}/approve`
  - `GET/PUT /api/admin/profile`
  - Frontend file: `src/app/services/admin.service.ts`

- Doctor appointment route alignment
  - `GET/POST/PUT/DELETE /api/doctor/appointments`
  - Frontend file: `src/app/services/appointment.service.ts`

- Notification route alignment
  - `GET /api/patient/notifications`
  - `PUT /api/patient/notifications/{id}/read`
  - `GET/POST /api/admin/notifications`
  - Frontend file: `src/app/services/notification.service.ts`

- Document route alignment
  - `GET /api/patient/documents`
  - `GET /api/admin/documents` (overview/fallback lookups)
  - `POST /api/patient/upload-document`
  - Frontend file: `src/app/services/document.service.ts`

- Analytics route alignment
  - `GET /api/admin/analytics`
  - `GET /api/doctor/analytics`
  - `GET /api/patient/analytics`
  - Frontend file: `src/app/services/analytics.service.ts`

- Prescription route alignment (record-based)
  - `GET /api/patient/records`
  - `GET/POST/PUT /api/doctor/patients/{patientId}/records`
  - Frontend file: `src/app/services/prescription.service.ts`

- User service alignment (admin/auth based)
  - `GET /api/admin/patients`
  - `PUT/DELETE /api/admin/patients/{id}`
  - `POST /api/auth/add-user`
  - Frontend file: `src/app/services/user.service.ts`

## Pending / Needs Frontend Changes

- No major blocking API gaps remain for current doctor/admin/patient portal routes.
- Remaining items are quality improvements:
  - Standardize API response contracts across all controllers (`{ message, data, total }`).
  - Remove temporary frontend compatibility cache used for legacy backend instances during transition.

## Frontend Files Changed So Far

- `src/app/services/patient.service.ts`
- `src/app/services/doctor.service.ts`
- `src/app/services/admin.service.ts`
- `src/app/services/appointment.service.ts`
- `src/app/services/notification.service.ts`
- `src/app/services/document.service.ts`
- `src/app/services/analytics.service.ts`
- `src/app/services/prescription.service.ts`
- `src/app/services/user.service.ts`

## Latest Safe Integration Pass

- Updated `src/app/services/doctor.service.ts`
  - Rewired doctor CRUD to `/api/admin/doctors`
  - Connected doctor profile, patient records CRUD, AI approval, and appointment APIs
  - Added non-breaking fallbacks (`[]` / no-op) where backend routes are unavailable
  - Kept existing method names and signatures used by doctor portal components

- Updated `src/app/services/patient.service.ts`
  - Rewired profile/history/document/report calls to available patient endpoints
  - Connected explicit upload-history and personal analytics methods
  - Added safe fallbacks for missing APIs (metrics/chatbot/export/cnic verification)
  - Kept existing method names/signatures used by patient portal components

- Updated `src/app/auth/auth.service.ts`
  - Login now supports `identifier` (`email` / `phone` / `cnic`) and also sends `email` for backward compatibility with older backend login DTOs.

- Updated `src/app/services/doctor.service.ts`
  - Added robust fallback for patient registration when CNIC upsert endpoint is unavailable.
  - Added merged patient-source behavior (API + local cache) for immediate portal visibility during backend rollout.
  - Added resilient CNIC lookup fallback through patient list search.

## Recommended Next Steps

1. Add missing backend endpoints (preferred) for the still-used frontend features, or
2. Refactor UI flows to consume only available routes, and
3. Standardize response contracts (`{ message, data, total }`) across services for consistent mapping.

## Verification

- Frontend build status: `npm run build` passed successfully after integration updates.
- Build warning: existing style budget warning in `src/app/common/home/home.scss` (not related to API wiring).

## Backend Handover File

- Created: `BACKEND_API_GAPS_FOR_ENGINEERING.md`
- Purpose: send to backend engineer for missing endpoint implementation plan.

## Component Smoke Pass (Service Wiring)

Scope: static service-call audit for `patient-portal`, `doctor-portal`, and `admin` modules, plus successful `npm run build`.

Status legend:

- `working`: mapped to available backend APIs
- `partial`: works with fallback/no-op or approximation
- `blocked`: requires backend API that does not exist

### Patient Portal

- `dashboard` -> `partial` (`metrics` still fallback; history/prescriptions/xrays/notifications wired)
- `notifications` -> `working`
- `access-records` -> `partial` (`exportRecords` is fallback blob)
- `view-xrays` -> `working` (mapped through documents source)
- `view-prescriptions` -> `working` (mapped through records source)
- `upload-documents` -> `working`
- `test-report-analysis` -> `working`
- `view-medical-history` -> `working`
- `doctor-search` -> `partial` (uses admin doctor listing fallback instead of patient-specific search endpoint)
- `ai-chatbot` -> `partial` (fallback response until backend chatbot API exists)
- `add-metrics` -> `partial` (metrics endpoints missing in backend)
- `profile-settings` -> `partial` (`verifyCNIC` fallback; profile read/update works)

### Doctor Portal

- `dashboard` -> `partial` (global prescriptions/xrays/messages lists use safe fallback when no patientId)
- `patient-analytics` -> `working`
- `upload-xray` -> `working`
- `upload-prescription` -> `working`
- `document-storage` -> `working` (`DELETE /api/doctor/documents/{id}` is implemented and wired)
- `secure-communication` -> `working` (`GET /api/doctor/messages` is implemented and wired)
- `patient-details` -> `working`
- `profile-settings` -> `working` (via admin doctor list/update paths)
- `patient-management` -> `working`
- `register-patient` -> `working` (CNIC lookup-first + upsert flow for existing or no-account patient)

### Admin Portal

- `dashboard` -> `working` (analytics + users + integrations + repository)
- `user-verification` -> `working` (approve/reject + role updates persist)
- `manage-repository` -> `working`
- `manage-integrations` -> `working`
- `manage-patients` -> `working`
- `notifications` -> `working`
- `manage-doctors` -> `working` (verify uses persisted status store)
- `analytics` -> `working`
- `system-health` -> `partial` (logs/error endpoints return empty placeholders; performance available)

## Doctor/Admin UI API Test Matrix (Latest)

Tested through frontend UI (`localhost:4200`) against backend API (`http://localhost:7124`).

### Admin Dashboard + Pages

- `dashboard` -> `working`
  - `GET /api/admin/profile`, `GET /api/admin/analytics`, `GET /api/admin/analytics/kpis`, `GET /api/admin/users`, `GET /api/admin/integrations`, `GET /api/admin/repository` returned `200`.
- `manage-doctors` -> `working`
  - Add doctor from UI now succeeds (`POST /api/admin/doctors` -> `200`).
- `user-verification` -> `working`
  - List + approve action verified (`GET /api/admin/users` and `PUT /api/admin/users/{id}/approve` -> `200`).
- `manage-integrations` -> `working`
  - Create integration verified (`POST /api/admin/integrations` -> `200`).
- `system-health` -> `working`
  - `GET /api/admin/logs`, `GET /api/admin/logs/errors`, `GET /api/admin/performance` -> `200`.
- `notifications` -> `partial`
  - API reachable (`GET /api/admin/notifications` -> `200`) but send can fail from UI when no medical record exists (`No medical records available to send admin notification.`).

### Doctor Dashboard + Pages

- `profile-settings` -> `working`
  - `GET /api/doctor/profile` and `PUT /api/doctor/profile` verified from UI.
- `document-storage` -> `working`
  - `GET /api/doctor/documents` -> `200`.
- `dashboard` -> `working`
  - Doctor aggregate APIs now resolve with latest backend + query fixes.
- `patient-management` -> `working`
  - Includes newly registered patients and CNIC-filtered lookup behavior.
- `secure-communication` -> `working`
  - Patient list + message listing wired and available.

## CNIC-Primary Identity Update (Latest)

- Patient identity is now CNIC-first in API workflows:
  - Auth login supports `identifier` (`email` / `phone` / `cnic`).
  - New patient creation enforces unique CNIC and unique email binding.
  - New doctor endpoints:
    - `GET /api/doctor/patients/lookup-by-cnic/{cnic}`
    - `POST /api/doctor/patients/upsert-by-cnic`
  - Existing doctor patient-record endpoints now accept patient CNIC in `{patientId}` routes (for backward compatibility with old IDs).
- Frontend doctor registration flow now:
  - searches CNIC first,
  - continues with existing patient when found,
  - otherwise upserts patient with optional portal account creation.

### Remaining Backend/Data Blockers (from runtime logs)

- No hard blockers for current core doctor registration/search/list flows after API restart with latest code.
- Keep DB schema alignment under observation for environments that still have legacy table/column drift.

## Latest Runtime Fixes (Current Session)

- API process restarted successfully to load newest backend routes and controller changes.
- Frontend environment aligned to active backend host (`http://localhost:7124`) to eliminate login host mismatch failures.
- Doctor patient list endpoint now returns all patients (not only record-linked), fixing "patient exists in DB but not visible in portal."
- CNIC search flow now works across:
  - native backend lookup endpoint, and
  - fallback list-based resolution for legacy instances.
