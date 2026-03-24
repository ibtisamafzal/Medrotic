# Backend API Gaps For Engineering

This file tracks backend API gaps and rollout notes for engineering handover.

**Last Updated:** 2026-03-23

## Short Summary
- Core APIs required by current doctor/admin/patient flows are implemented.
- During rollout, frontend compatibility fallbacks were added for:
  - legacy login DTOs expecting `email` instead of `identifier`
  - legacy backend instances missing doctor CNIC upsert endpoints.
- Remaining work is primarily consistency and environment hardening (see section below).

## Updated Files
- `Medrotic.Api/Controllers/PatientController.cs`
- `Medrotic.Api/Controllers/DoctorController.cs`
- `Medrotic.Api/Controllers/AdminController.cs`
- `Medrotic.Api/DTOs/HealthMetricDto.cs` (new)
- `Medrotic.Api/DTOs/ChatbotMessageDto.cs` (new)
- `Medrotic.Api/DTOs/ChatbotResponseDto.cs` (new)
- `Medrotic.Api/DTOs/VerifyCnicDto.cs` (new)
- `src/app/services/doctor.service.ts`
- `src/app/auth/auth.service.ts`
- `src/environments/environment.ts`

## Implemented APIs (from this list)
- Patient: `GET/POST /api/patient/metrics`, `POST /api/patient/chatbot`, `GET /api/patient/doctors`, `GET /api/patient/prescriptions`, `GET /api/patient/xrays`, `GET /api/patient/records/export`, `POST /api/patient/verify-cnic`
- Doctor: `GET /api/doctor/prescriptions`, `GET /api/doctor/xrays`, `GET /api/doctor/messages`, `GET/DELETE /api/doctor/documents/{id}`, `GET /api/doctor/patients/lookup-by-cnic/{cnic}`, `POST /api/doctor/patients/upsert-by-cnic`
- Admin: `PUT /api/admin/doctors/{id}/verify`, `GET /api/admin/users`, `PUT /api/admin/users/{id}/approve`, `PUT /api/admin/users/{id}/reject`, `PUT /api/admin/users/{id}/role`, `GET /api/admin/logs`, `GET /api/admin/logs/errors`, `GET /api/admin/performance`, `GET /api/admin/integrations` + integration CRUD, `GET /api/admin/repository` + repository CRUD, `GET /api/admin/analytics/kpis`

## Patient-side coverage (implemented)

- `GET /api/patient/metrics`
  - Needed by: `src/app/services/patient.service.ts` (`getMetrics`)
- `POST /api/patient/metrics`
  - Needed by: `src/app/services/patient.service.ts` (`addMetrics`)
- `POST /api/patient/chatbot`
  - Needed by: `src/app/services/patient.service.ts` (`sendChatbotQuery`)
- `GET /api/patient/doctors` (filterable by city/specialty/disease/experience)
  - Needed by: `src/app/services/patient.service.ts` (`searchDoctors`)
- `GET /api/patient/prescriptions`
  - Needed by: `src/app/services/patient.service.ts` (`getPrescriptions`)
- `GET /api/patient/xrays`
  - Needed by: `src/app/services/patient.service.ts` (`getXrays`)
- `GET /api/patient/records/export?format=pdf|csv`
  - Needed by: `src/app/services/patient.service.ts` (`exportRecords`)
- `POST /api/patient/verify-cnic`
  - Needed by: `src/app/services/patient.service.ts` (`verifyCNIC`)

## Doctor-side coverage (implemented)

- `GET /api/doctor/prescriptions`
  - Needed by: doctor dashboard aggregate listing without requiring a single patient ID
  - Used via: `src/app/services/doctor.service.ts` (`getPrescriptions`)
- `GET /api/doctor/xrays`
  - Needed by: doctor dashboard aggregate listing without requiring a single patient ID
  - Used via: `src/app/services/doctor.service.ts` (`getXrays`)
- `GET /api/doctor/messages` (or inbox endpoint)
  - Needed by: `src/app/services/doctor.service.ts` (`getMessages`)
- `GET /api/doctor/documents` and `DELETE /api/doctor/documents/{id}`
  - Needed by: `src/app/services/doctor.service.ts` (`getDocuments`, `deleteDocument`)

## Admin-side coverage (implemented)

- `PUT /api/admin/doctors/{id}/verify`
  - Needed by: `src/app/services/admin.service.ts` (`verifyDoctor`) and `src/app/admin/manage-doctors/*`
- `GET /api/admin/users`
- `PUT /api/admin/users/{id}/approve`
- `PUT /api/admin/users/{id}/reject`
- `PUT /api/admin/users/{id}/role`
  - Needed by: `src/app/services/admin.service.ts` users module
- `GET /api/admin/logs`
- `GET /api/admin/logs/errors`
- `GET /api/admin/performance`
  - Needed by: `src/app/services/admin.service.ts` system health module
- `GET /api/admin/integrations`
- `POST /api/admin/integrations`
- `PUT /api/admin/integrations/{id}`
- `DELETE /api/admin/integrations/{id}`
  - Needed by: `src/app/services/admin.service.ts` integrations module
- `GET /api/admin/repository`
- `POST /api/admin/repository/upload`
- `DELETE /api/admin/repository/{id}`
  - Needed by: `src/app/services/admin.service.ts` repository module
- `GET /api/admin/analytics/kpis`
  - Optional if `GET /api/admin/analytics` already returns complete KPI payload

## Remaining Engineering Gaps / Actions

- **Environment consistency**
  - Ensure all team members and deployment profiles use a single agreed backend URL/port for dev (to avoid frontend host mismatch issues).
  - Current verified local backend runtime: `http://localhost:7124`.
- **Response contract consistency**
  - Standardize all controller responses to consistent envelopes.
- **Schema migration alignment**
  - Validate DB schema for all environments (appointments and doctor-related legacy query columns) and run required migrations.
- **Transitional fallback cleanup**
  - After all environments run latest backend routes, remove frontend compatibility fallbacks for legacy doctor register/login behavior.
  - Target cleanup areas: `src/app/auth/auth.service.ts` and `src/app/services/doctor.service.ts`.

## Suggested response contract

To reduce frontend mapping complexity, return consistent envelopes:

- List endpoints: `{ message: string, data: T[], total?: number }`
- Single entity endpoints: `{ message: string, data: T }`
- Action endpoints: `{ message: string, ... }`
