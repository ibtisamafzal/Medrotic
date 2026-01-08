# Backend API Documentation - Medrotic Platform

This document contains all API endpoints, data structures, and mock data required for backend implementation.

## Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [Patient APIs](#patient-apis)
3. [Doctor APIs](#doctor-apis)
4. [Admin APIs](#admin-apis)
5. [Appointment APIs](#appointment-apis)
6. [Prescription APIs](#prescription-apis)
7. [Document APIs](#document-apis)
8. [Analytics APIs](#analytics-apis)
9. [Notification APIs](#notification-apis)
10. [Contact APIs](#contact-apis)
11. [Data Models](#data-models)
12. [Mock Data](#mock-data)
13. [Authentication & Security](#authentication--security)

---

## Authentication APIs

Base URL: `/api/auth`

### POST /api/auth/login
Login with email/phone/CNIC, password, and role.

**Request Body:**
```json
{
  "email": "string (optional)",
  "phone": "string (optional)",
  "cnic": "string (optional)",
  "password": "string (required)",
  "role": "admin | doctor | patient (required)",
  "rememberMe": "boolean (optional)"
}
```

**Response:**
```json
{
  "id": "string",
  "email": "string",
  "phone": "string",
  "cnic": "string",
  "role": "admin | doctor | patient",
  "name": "string",
  "token": "string (JWT)"
}
```

### POST /api/auth/register
Register new patient (CNIC-based). Only patients can self-register.

**Request Body:**
```json
{
  "email": "string (optional)",
  "phone": "string (optional)",
  "cnic": "string (required)",
  "password": "string (required)",
  "name": "string (required)",
  "role": "patient (required)",
  "dateOfBirth": "string (optional, ISO date)",
  "gender": "string (optional)"
}
```

### POST /api/auth/forgot-password
Request password reset via email or SMS.

**Request Body:**
```json
{
  "email": "string (optional)",
  "phone": "string (optional)",
  "method": "email | sms (required)"
}
```

**Response:**
```json
{
  "message": "string",
  "otpSent": true
}
```

### POST /api/auth/verify-otp
Verify OTP for password reset, registration, or login.

**Request Body:**
```json
{
  "email": "string (optional)",
  "phone": "string (optional)",
  "otp": "string (required)",
  "type": "password_reset | registration | login (required)"
}
```

**Response:**
```json
{
  "verified": true,
  "token": "string (JWT, optional)"
}
```

### POST /api/auth/resend-otp
Resend OTP.

**Request Body:**
```json
{
  "email": "string (optional)",
  "phone": "string (optional)"
}
```

### POST /api/auth/reset-password
Reset password with token from OTP verification.

**Request Body:**
```json
{
  "token": "string (required)",
  "newPassword": "string (required)",
  "confirmPassword": "string (required)"
}
```

### POST /api/auth/google
Google OAuth login.

**Request Body:**
```json
{
  "role": "admin | doctor | patient (optional)"
}
```

### POST /api/auth/change-password
Change password (for authenticated users).

**Request Body:**
```json
{
  "oldPassword": "string (required)",
  "newPassword": "string (required)"
}
```

---

## Patient APIs

Base URL: `/api/patient` (for patient portal) and `/api/patients` (for admin/doctor use)

### GET /api/patients
Get all patients (admin/doctor use).

**Response:** Array of Patient objects

### GET /api/patients/:id
Get patient by ID.

**Response:** Patient object

### POST /api/patients
Create new patient.

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "phone": "string (optional)",
  "cnic": "string (optional)",
  "dateOfBirth": "string (optional)",
  "address": "string (optional)",
  "medicalHistory": "string (optional)"
}
```

### PUT /api/patients/:id
Update patient.

**Request Body:** Partial Patient object

### DELETE /api/patients/:id
Delete patient.

### GET /api/patients/:patientId/medical-history
Get patient medical history (old endpoint).

**Response:** Medical history data

### GET /api/patient/history
Get medical records for current patient.

**Response:** Array of MedicalHistory objects

### POST /api/patient/metrics
Add health metrics/vitals.

**Request Body:**
```json
{
  "date": "string (ISO date, required)",
  "bloodPressure": "string (optional)",
  "heartRate": "number (optional)",
  "temperature": "number (optional)",
  "weight": "number (optional)",
  "height": "number (optional)",
  "bloodSugar": "number (optional)",
  "symptoms": "string (optional)",
  "notes": "string (optional)"
}
```

### GET /api/patient/metrics
Get metrics history.

**Response:** Array of HealthMetric objects

### POST /api/patient/chatbot
Send query to AI chatbot.

**Request Body:**
```json
{
  "query": "string (required)",
  "context": "object (optional)"
}
```

**Response:**
```json
{
  "response": "string",
  "suggestions": ["string array (optional)"]
}
```

### GET /api/patient/doctors
Search doctors with filters.

**Query Parameters:**
- `city`: string (optional)
- `specialty`: string (optional)
- `disease`: string (optional)
- `experience`: number (optional)

**Response:** Array of Doctor objects

### POST /api/patient/reports
Upload test report document.

**Request:** FormData with `document` file

**Response:**
```json
{
  "id": "string",
  "file": "string",
  "fileName": "string",
  "analysis": "string (AI analysis, optional)",
  "uploadedAt": "string"
}
```

### GET /api/patient/reports
Get uploaded reports.

**Response:** Array of TestReport objects

### GET /api/patient/prescriptions
Get patient prescriptions.

**Response:** Array of Prescription objects

### GET /api/patient/xrays
Get patient X-rays.

**Response:** Array of Xray objects

### POST /api/patient/documents
Upload document (general).

**Request:** FormData with `file` and optional `type`

### GET /api/patient/notifications
Get patient notifications.

**Response:** Array of Notification objects

### PUT /api/patient/notifications/:id/read
Mark notification as read.

### GET /api/patient/records
Get access records with search.

**Query Parameters:**
- `search`: string (optional)

**Response:** Array of MedicalHistory objects

### GET /api/patient/records/export
Export records.

**Query Parameters:**
- `format`: "pdf" | "csv" (default: "pdf")

**Response:** Blob (file download)

### POST /api/patient/verify-cnic
Verify CNIC.

**Request Body:**
```json
{
  "cnic": "string (required)"
}
```

**Response:**
```json
{
  "verified": true,
  "message": "string (optional)"
}
```

### PUT /api/patient/profile
Update patient profile.

**Request Body:** Partial Patient object

---

## Doctor APIs

Base URL: `/api/doctor` (for doctor portal) and `/api/doctors` (for admin use)

### GET /api/doctors
Get all doctors.

**Response:** Array of Doctor objects

### GET /api/doctors/:id
Get doctor by ID.

**Response:** Doctor object

### POST /api/doctors
Create new doctor.

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "phone": "string (optional)",
  "specialization": "string (optional)",
  "licenseNumber": "string (optional)",
  "hospital": "string (optional)"
}
```

### PUT /api/doctors/:id
Update doctor.

**Request Body:** Partial Doctor object

### DELETE /api/doctors/:id
Delete doctor.

### GET /api/doctors/:doctorId/patients
Get doctor's patients.

**Response:** Array of Patient objects

### GET /api/doctor/patients
Get patients (with search).

**Query Parameters:**
- `search`: string (optional)

**Response:** Array of Patient objects

### GET /api/doctor/patients/:id
Get patient by ID.

**Response:** Patient object

### POST /api/doctor/patients
Register new patient.

**Request Body:** Partial Patient object

### PUT /api/doctor/patients/:id
Update patient.

**Request Body:** Partial Patient object

### POST /api/doctor/prescriptions
Upload prescription (with OCR/AI analysis).

**Request:** FormData or JSON with:
```json
{
  "patientId": "string (required)",
  "image": "File (optional)",
  "ocrText": "string (optional)",
  "aiAnalysis": "string (optional)",
  "medications": [
    {
      "name": "string",
      "dosage": "string",
      "frequency": "string",
      "duration": "string"
    }
  ],
  "notes": "string (optional)"
}
```

### GET /api/doctor/prescriptions
Get prescriptions.

**Query Parameters:**
- `patientId`: string (optional)

**Response:** Array of Prescription objects

### GET /api/doctor/prescriptions/:id
Get prescription by ID.

**Response:** Prescription object

### POST /api/doctor/xrays
Upload X-ray (with AI analysis).

**Request:** FormData or JSON with:
```json
{
  "patientId": "string (required)",
  "image": "File (required)",
  "aiAnalysis": "string (optional)",
  "findings": "string (optional)",
  "recommendations": "string (optional)"
}
```

### GET /api/doctor/xrays
Get X-rays.

**Query Parameters:**
- `patientId`: string (optional)

**Response:** Array of Xray objects

### GET /api/doctor/xrays/:id
Get X-ray by ID.

**Response:** Xray object

### POST /api/doctor/messages
Send secure message to patient.

**Request Body:**
```json
{
  "to": "string (patient ID, required)",
  "content": "string (required)"
}
```

### GET /api/doctor/messages
Get messages.

**Query Parameters:**
- `patientId`: string (optional)

**Response:** Array of Message objects

### GET /api/doctor/analytics/:patientId
Get patient analytics.

**Response:**
```json
{
  "patientId": "string",
  "totalVisits": "number",
  "totalPrescriptions": "number",
  "totalXrays": "number",
  "lastVisit": "string (ISO date)",
  "healthTrends": [
    {
      "date": "string",
      "metric": "string",
      "value": "number"
    }
  ],
  "medications": [
    {
      "name": "string",
      "adherence": "number"
    }
  ]
}
```

### POST /api/doctor/documents
Upload document.

**Request:** FormData or JSON with Document object

### GET /api/doctor/documents
Get documents.

**Query Parameters:**
- `patientId`: string (optional)

**Response:** Array of Document objects

### DELETE /api/doctor/documents/:id
Delete document.

---

## Admin APIs

Base URL: `/api/admin`

### GET /api/admin/doctors
Get all doctors.

**Response:** Array of Doctor objects

### GET /api/admin/doctors/:id
Get doctor by ID.

**Response:** Doctor object

### POST /api/admin/doctors
Add new doctor.

**Request Body:** Partial Doctor object

### PUT /api/admin/doctors/:id
Update doctor.

**Request Body:** Partial Doctor object

### DELETE /api/admin/doctors/:id
Delete doctor.

### PUT /api/admin/doctors/:id/verify
Verify/reject doctor.

**Request Body:**
```json
{
  "verified": "boolean (required)"
}
```

### GET /api/admin/patients
Get all patients.

**Response:** Array of Patient objects

### GET /api/admin/patients/:id
Get patient by ID.

**Response:** Patient object

### PUT /api/admin/patients/:id
Update patient.

**Request Body:** Partial Patient object

### DELETE /api/admin/patients/:id
Delete patient.

### GET /api/admin/users
Get all users.

**Response:** Array of User objects

### PUT /api/admin/users/:id/approve
Approve user.

### PUT /api/admin/users/:id/reject
Reject user.

### PUT /api/admin/users/:id/role
Update user role.

**Request Body:**
```json
{
  "role": "admin | doctor | patient (required)"
}
```

### GET /api/admin/logs
Get system logs.

**Query Parameters:**
- `limit`: number (optional)

**Response:** Array of SystemLog objects

### GET /api/admin/logs/errors
Get error reports.

**Response:** Array of SystemLog objects

### GET /api/admin/performance
Get performance stats.

**Response:** Performance metrics object

### GET /api/admin/integrations
Get integrations.

**Response:** Array of Integration objects

### POST /api/admin/integrations
Create integration.

**Request Body:** Partial Integration object

### PUT /api/admin/integrations/:id
Update integration.

**Request Body:** Partial Integration object

### DELETE /api/admin/integrations/:id
Delete integration.

### GET /api/admin/repository
Get repository items.

**Response:** Array of RepositoryItem objects

### POST /api/admin/repository/upload
Upload repository item.

**Request:** FormData with `file`

### DELETE /api/admin/repository/:id
Delete repository item.

### GET /api/admin/analytics
Get analytics.

**Response:** Analytics object

### GET /api/admin/analytics/kpis
Get KPIs.

**Response:** KPIs object

### POST /api/admin/notifications
Send notification.

**Request Body:**
```json
{
  "message": "string (required)",
  "targets": ["string array (user IDs or roles)"],
  "type": "push | email | sms (required)",
  "scheduledAt": "string (ISO date, optional)"
}
```

### GET /api/admin/notifications
Get notifications.

**Response:** Array of Notification objects

---

## Appointment APIs

Base URL: `/api/appointments`

### GET /api/appointments
Get all appointments.

**Response:** Array of Appointment objects

### GET /api/appointments/:id
Get appointment by ID.

**Response:** Appointment object

### GET /api/appointments/patient/:patientId
Get appointments by patient ID.

**Response:** Array of Appointment objects

### GET /api/appointments/doctor/:doctorId
Get appointments by doctor ID.

**Response:** Array of Appointment objects

### POST /api/appointments
Create new appointment.

**Request Body:**
```json
{
  "patientId": "string (required)",
  "doctorId": "string (required)",
  "date": "string (ISO date, required)",
  "time": "string (required)",
  "reason": "string (optional)",
  "notes": "string (optional)"
}
```

### PUT /api/appointments/:id
Update appointment.

**Request Body:** Partial Appointment object

### PUT /api/appointments/:id/cancel
Cancel appointment.

**Request Body:** {} (empty)

### DELETE /api/appointments/:id
Delete appointment.

---

## Prescription APIs

Base URL: `/api/prescriptions`

### GET /api/prescriptions
Get all prescriptions.

**Response:** Array of Prescription objects

### GET /api/prescriptions/:id
Get prescription by ID.

**Response:** Prescription object

### GET /api/prescriptions/patient/:patientId
Get prescriptions by patient ID.

**Response:** Array of Prescription objects

### GET /api/prescriptions/doctor/:doctorId
Get prescriptions by doctor ID.

**Response:** Array of Prescription objects

### POST /api/prescriptions
Create new prescription.

**Request Body:**
```json
{
  "patientId": "string (required)",
  "doctorId": "string (required)",
  "medications": [
    {
      "name": "string (required)",
      "dosage": "string (required)",
      "frequency": "string (required)",
      "duration": "string (required)"
    }
  ],
  "diagnosis": "string (optional)",
  "notes": "string (optional)",
  "date": "string (ISO date, required)"
}
```

### PUT /api/prescriptions/:id
Update prescription.

**Request Body:** Partial Prescription object

### DELETE /api/prescriptions/:id
Delete prescription.

---

## Document APIs

Base URL: `/api/documents`

### GET /api/documents
Get all documents.

**Response:** Array of Document objects

### GET /api/documents/:id
Get document by ID.

**Response:** Document object

### GET /api/documents/patient/:patientId
Get documents by patient ID.

**Response:** Array of Document objects

### GET /api/documents/type/:type
Get documents by type.

**Response:** Array of Document objects

### POST /api/documents/upload
Upload document.

**Request:** FormData with:
- `file`: File (required)
- `patientId`: string (required)
- `type`: string (required)
- `description`: string (optional)

**Response:** Document object

### DELETE /api/documents/:id
Delete document.

### GET /api/documents/:id/download
Download document.

**Response:** Blob (file download)

---

## Analytics APIs

Base URL: `/api/analytics`

### GET /api/analytics/dashboard
Get dashboard analytics.

**Response:**
```json
{
  "totalPatients": "number",
  "totalDoctors": "number",
  "totalPrescriptions": "number",
  "totalDocuments": "number",
  "recentActivity": ["array"],
  "dateRange": {
    "start": "string (ISO date)",
    "end": "string (ISO date)"
  }
}
```

### GET /api/analytics/patient/:patientId
Get patient analytics.

**Response:** Patient analytics object

### GET /api/analytics/system-health
Get system health metrics.

**Response:** System health object

### GET /api/analytics/usage
Get usage statistics.

**Query Parameters:**
- `startDate`: string (ISO date, optional)
- `endDate`: string (ISO date, optional)

**Response:** Usage statistics object

---

## Notification APIs

Base URL: `/api/notifications`

### GET /api/notifications
Get all notifications for current user.

**Response:** Array of Notification objects

### GET /api/notifications/:id
Get notification by ID.

**Response:** Notification object

### GET /api/notifications/unread
Get unread notifications.

**Response:** Array of Notification objects

### PUT /api/notifications/:id/read
Mark notification as read.

**Request Body:** {} (empty)

### PUT /api/notifications/read-all
Mark all notifications as read.

**Request Body:** {} (empty)

### DELETE /api/notifications/:id
Delete notification.

### POST /api/notifications
Create notification (admin/doctor only).

**Request Body:**
```json
{
  "userId": "string (required)",
  "title": "string (required)",
  "message": "string (required)",
  "type": "info | warning | error | success (required)"
}
```

---

## Contact APIs

Base URL: `/api/contact`

### POST /api/contact
Submit contact form.

**Request Body:**
```json
{
  "fullName": "string (required)",
  "phoneNumber": "string (required)",
  "email": "string (required)",
  "queryType": "string (required)",
  "message": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "string",
  "id": "string (optional)"
}
```

---

## User APIs

Base URL: `/api/users`

### GET /api/users
Get all users.

**Response:** Array of User objects

### GET /api/users/:id
Get user by ID.

**Response:** User object

### POST /api/users
Create new user.

**Request Body:** Partial User object

### PUT /api/users/:id
Update user.

**Request Body:** Partial User object

### DELETE /api/users/:id
Delete user.

---

## Data Models

### User
```typescript
{
  id: string;
  email?: string;
  phone?: string;
  cnic?: string;
  role: 'admin' | 'doctor' | 'patient';
  name: string;
  token?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### Patient
```typescript
{
  id: string;
  name: string;
  email: string;
  phone?: string;
  cnic?: string;
  cnicVerified?: boolean;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  medicalHistory?: string;
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}
```

### Doctor
```typescript
{
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  specialty?: string;
  licenseNumber?: string;
  hospital?: string;
  city?: string;
  experience?: number;
  qualifications?: string[];
  rating?: number;
  status?: 'pending' | 'verified' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
}
```

### Appointment
```typescript
{
  id: string;
  patientId: string;
  doctorId: string;
  date: string; // ISO date
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  reason?: string;
  notes?: string;
  createdAt?: string;
}
```

### Prescription
```typescript
{
  id: string;
  patientId: string;
  doctorId: string;
  doctorName?: string;
  date: string; // ISO date
  medications: Medication[];
  diagnosis?: string;
  notes?: string;
  image?: File | string;
  ocrText?: string;
  aiAnalysis?: string;
  createdAt?: string;
}
```

### Medication
```typescript
{
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}
```

### Xray
```typescript
{
  id: string;
  patientId: string;
  doctorId?: string;
  doctorName?: string;
  fileName: string;
  fileUrl: string;
  image?: File | string;
  aiAnalysis?: string;
  findings?: string;
  recommendations?: string;
  uploadedAt: string;
  createdAt?: string;
}
```

### Document
```typescript
{
  id: string;
  patientId: string;
  doctorId?: string;
  name: string;
  type: 'prescription' | 'xray' | 'lab-report' | 'medical-record' | 'report' | 'other';
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  description?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string;
  verifiedAt?: string;
  uploadedAt: string;
  createdAt?: string;
}
```

### MedicalHistory
```typescript
{
  id: string;
  date: string; // ISO date
  type: 'prescription' | 'xray' | 'test' | 'visit' | 'metric';
  title: string;
  description?: string;
  doctorName?: string;
  attachments?: string[];
  createdAt: string;
}
```

### HealthMetric
```typescript
{
  id?: string;
  date: string; // ISO date
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  bloodSugar?: number;
  symptoms?: string;
  notes?: string;
}
```

### Notification
```typescript
{
  id: string;
  userId?: string;
  type: 'update' | 'result' | 'approval' | 'reminder' | 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}
```

### Message
```typescript
{
  id?: string;
  to: string; // patient ID
  from?: string; // doctor ID
  content: string;
  timestamp?: string;
  read?: boolean;
}
```

### TestReport
```typescript
{
  id?: string;
  file: File | string;
  fileName?: string;
  analysis?: string; // AI analysis
  uploadedAt?: string;
}
```

### ChatbotMessage
```typescript
{
  query: string;
  context?: any;
}
```

### ChatbotResponse
```typescript
{
  response: string;
  suggestions?: string[];
}
```

### Analytics
```typescript
{
  totalPatients: number;
  totalDoctors: number;
  totalUsers: number;
  totalPrescriptions?: number;
  totalDocuments?: number;
  activeAppointments: number;
  patientGrowth: { month: string; count: number }[];
  doctorGrowth: { month: string; count: number }[];
  recentActivity?: any[];
  kpis: {
    avgResponseTime: number;
    systemUptime: number;
    activeUsers: number;
    dataStorage: number;
  };
  dateRange?: {
    start: string;
    end: string;
  };
}
```

### PatientAnalytics
```typescript
{
  patientId: string;
  totalVisits: number;
  totalPrescriptions: number;
  totalXrays: number;
  lastVisit?: string;
  healthTrends?: {
    date: string;
    metric: string;
    value: number;
  }[];
  medications?: {
    name: string;
    adherence: number;
  }[];
}
```

### SystemLog
```typescript
{
  id: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
  source?: string;
}
```

### Integration
```typescript
{
  id: string;
  name: string;
  type: 'ehr' | 'api' | 'external';
  status: 'active' | 'inactive' | 'error';
  endpoint?: string;
  lastSync?: string;
}
```

### RepositoryItem
```typescript
{
  id: string;
  name: string;
  type: 'document' | 'image' | 'data';
  size: number;
  uploadedAt: string;
  uploadedBy?: string;
}
```

---

## Mock Data

### Default Admin Credentials (Development Only)
```json
{
  "email": "admin@medrotic.com",
  "password": "Admin@123",
  "role": "admin"
}
```

### Default Doctor Credentials (Development Only)
```json
{
  "email": "doctor@medrotic.com",
  "password": "Doctor@123",
  "role": "doctor"
}
```

### Default Patient Credentials (Development Only)
```json
{
  "email": "patient@medrotic.com",
  "password": "Patient@123",
  "role": "patient"
}
```

### Mock Patients
```json
[
  {
    "id": "1",
    "name": "John Doe",
    "cnic": "12345-1234567-1",
    "phone": "+923001234567",
    "email": "john@example.com",
    "status": "active"
  },
  {
    "id": "2",
    "name": "Jane Smith",
    "cnic": "12345-1234567-2",
    "phone": "+923001234568",
    "email": "jane@example.com",
    "status": "active"
  },
  {
    "id": "3",
    "name": "Mike Johnson",
    "cnic": "12345-1234567-3",
    "phone": "+923001234569",
    "email": "mike@example.com",
    "status": "active"
  },
  {
    "id": "4",
    "name": "Sarah Williams",
    "cnic": "12345-1234567-4",
    "phone": "+923001234570",
    "email": "sarah@example.com",
    "status": "active"
  },
  {
    "id": "5",
    "name": "David Brown",
    "cnic": "12345-1234567-5",
    "phone": "+923001234571",
    "email": "david@example.com",
    "status": "inactive"
  }
]
```

### Mock Doctors
```json
[
  {
    "id": "1",
    "name": "Dr. Ahmed Khan",
    "specialty": "Cardiology",
    "city": "Karachi",
    "experience": 15,
    "qualifications": ["MBBS", "FCPS"],
    "hospital": "Aga Khan Hospital",
    "rating": 4.8
  },
  {
    "id": "2",
    "name": "Dr. Fatima Ali",
    "specialty": "Dermatology",
    "city": "Lahore",
    "experience": 10,
    "qualifications": ["MBBS", "MCPS"],
    "hospital": "Shaukat Khanum Hospital",
    "rating": 4.9
  }
]
```

### Mock Chatbot Suggestions
```json
[
  "What are the symptoms of high blood pressure?",
  "How can I manage my diabetes?",
  "What should I do for a fever?",
  "Explain my recent test results"
]
```

### Mock AI Analysis (X-Ray)
```
AI Analysis: No acute abnormalities detected. Lungs appear clear. Heart size is within normal limits. No evidence of pneumonia or pleural effusion.
```

### Mock AI Analysis (Prescription)
```
AI Analysis: Detected medications include Paracetamol 500mg, Amoxicillin 250mg. Recommended dosage: 3 times daily for 7 days.
```

---

## Authentication & Security

### JWT Token Structure
The JWT token should contain:
- `id`: User ID
- `email`: User email
- `role`: User role (admin, doctor, patient)
- `name`: User name
- `exp`: Expiration timestamp (24 hours from issue)

### CNIC Validation
Pakistani CNIC format: `12345-1234567-1`
- Regex: `/^\d{5}-\d{7}-\d{1}$/`
- Format: 5 digits - 7 digits - 1 digit

### Phone Validation
Pakistani phone format: `+923001234567` or `03001234567`
- Regex: `/^(\+92|0)?[0-9]{10}$/`

### Email Validation
Standard email format
- Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

### Password Requirements
- Minimum 8 characters
- Should contain uppercase, lowercase, number, and special character
- Should be hashed on server-side (never store plain text)

### HIPAA Compliance Notes
1. **Password Security**: All passwords must be hashed server-side before storage
2. **Data Encryption**: All PHI (Protected Health Information) must be encrypted at rest and in transit
3. **Access Control**: Role-based access control (RBAC) must be implemented
4. **Audit Logs**: All access to patient data must be logged
5. **Data Retention**: Follow HIPAA data retention policies
6. **Secure Communication**: Use HTTPS for all API calls
7. **Token Expiration**: JWT tokens should expire after 24 hours
8. **CNIC Verification**: CNIC verification should be implemented for patient registration

### API Authentication
- All protected endpoints require JWT token in Authorization header
- Format: `Authorization: Bearer <token>`
- Token should be validated on every request
- Invalid/expired tokens should return 401 Unauthorized

### Role-Based Access Control
- **Admin**: Full access to all endpoints
- **Doctor**: Access to patient data, prescriptions, X-rays, messages, analytics
- **Patient**: Access to own data, prescriptions, X-rays, health metrics, chatbot

### Error Responses
Standard error response format:
```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE",
  "status": 400
}
```

### Success Responses
Standard success response format:
```json
{
  "success": true,
  "message": "Success message",
  "data": {}
}
```

---

## Additional Notes

### File Uploads
- Maximum file size: 10MB (configurable)
- Supported formats: PDF, JPG, PNG, DICOM (for X-rays)
- Files should be stored securely with unique identifiers
- File URLs should be signed/temporary for security

### Pagination
For list endpoints, implement pagination:
- Query parameters: `page`, `limit`
- Response should include: `data`, `total`, `page`, `limit`, `totalPages`

### Filtering & Sorting
- Support filtering via query parameters
- Support sorting via `sortBy` and `sortOrder` query parameters

### Rate Limiting
- Implement rate limiting to prevent abuse
- Recommended: 100 requests per minute per IP
- 1000 requests per hour per authenticated user

### CORS
- Configure CORS to allow requests from frontend domain
- Allow credentials for authenticated requests

---

**Last Updated:** 2024
**Version:** 1.0


