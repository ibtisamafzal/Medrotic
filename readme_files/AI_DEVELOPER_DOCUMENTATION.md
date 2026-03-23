# AI Developer Documentation - Medrotic Platform

This document contains all AI/ML-related endpoints, data structures, and requirements for AI implementation.

## Table of Contents
1. [Medrotic Project Overview](#medrotic-project-overview)
2. [Environment & Base URLs](#environment--base-urls)
3. [AI Endpoints](#ai-endpoints)
4. [AI Data Structures](#ai-data-structures)
5. [Chatbot Implementation](#chatbot-implementation)
6. [OCR Implementation](#ocr-implementation)
7. [X-Ray Analysis](#x-ray-analysis)
8. [Test Report Analysis](#test-report-analysis)
9. [AI Integration Requirements](#ai-integration-requirements)
10. [Response Formats](#response-formats)
11. [Error Handling](#error-handling)
12. [Testing & Validation](#testing--validation)

---

## Medrotic Project Overview

Medrotic is a healthcare platform with:
- An **Angular 20** frontend (`frontend` project in this repo).
- A **.NET backend API** exposing REST endpoints under `/api`.

This document describes the **AI-related backend contracts** (chatbot, OCR, X-ray, test report analysis) that are consumed by the Angular app through `PatientService`, `AuthService`, and related services.

As of 23 March 2026, this document is aligned with the current Angular + backend integration in this repository.

## Environment & Base URLs

- **Local development backend**: `http://localhost:7124` (see `src/environments/environment.ts`).
- **Production backend**: `https://your-production-api.com` (placeholder, set in `src/environments/environment.prod.ts`).
- **Auth base URL**: `${apiUrl}/api/Auth` (used by `AuthService` for login, registration, and password flows).
- **Patient AI base URL**: `${apiUrl}/api/patient` (for example, `http://localhost:7124/api/patient` in development).

## AI Endpoints

The Angular frontend currently uses the following AI-related endpoints on the backend:

- **POST `/api/patient/chatbot`**: AI-powered patient chatbot.
- **POST `/api/patient/upload-document`**: Upload report/document for AI workflow.
- **GET `/api/patient/documents`**: List uploaded documents and states.
- **GET `/api/patient/xrays`**: Fetch X-ray records with analysis summaries.
- **GET `/api/patient/prescriptions`**: Fetch prescription records (including OCR-derived structures where available).
- **POST `/api/doctor/patients/{patientId}/records`**: Doctor uploads prescription/X-ray records that feed patient-facing views.

Note: Legacy aliases like `/api/patient/reports` and `/api/patient/documents` (POST) are not the current integrated paths.

### POST /api/patient/chatbot
AI-powered chatbot for patient queries.

**Purpose:** Provide medical information, answer health questions, and assist patients.

**Request Body:**
```json
{
  "query": "string (required) - Patient's question",
  "context": {
    "timestamp": "string (ISO date)",
    "patientId": "string (optional)",
    "medicalHistory": "array (optional)",
    "recentMetrics": "array (optional)"
  }
}
```

**Response:**
```json
{
  "response": "string (required) - AI-generated response",
  "suggestions": [
    "string array (optional) - Follow-up question suggestions"
  ],
  "confidence": "number (optional, 0-1)",
  "sources": [
    "string array (optional) - Medical sources/references"
  ]
}
```

**Example Request:**
```json
{
  "query": "What are the symptoms of high blood pressure?",
  "context": {
    "timestamp": "2024-01-15T10:30:00Z",
    "patientId": "patient-123"
  }
}
```

**Example Response:**
```json
{
  "response": "High blood pressure (hypertension) often has no symptoms, but when present, may include headaches, shortness of breath, nosebleeds, and dizziness. It's important to monitor your blood pressure regularly and consult with a healthcare provider.",
  "suggestions": [
    "How can I lower my blood pressure?",
    "What causes high blood pressure?",
    "What medications are used for hypertension?"
  ],
  "confidence": 0.95,
  "sources": [
    "American Heart Association",
    "Mayo Clinic"
  ]
}
```

---

## AI Data Structures

### ChatbotMessage
```typescript
interface ChatbotMessage {
  query: string;                    // Patient's question
  context?: {
    timestamp?: string;             // ISO date
    patientId?: string;             // Patient identifier
    medicalHistory?: any[];         // Patient's medical history
    recentMetrics?: HealthMetric[]; // Recent health metrics
    currentSymptoms?: string[];     // Current symptoms
  };
}
```

In the Angular code (`ChatbotMessage` in `src/app/services/patient.service.ts`), the `context` field is currently typed as `any` to allow flexible payloads. The structure above is the expected shape that the backend AI implementation should support while remaining backward-compatible with the existing frontend.

### ChatbotResponse
```typescript
interface ChatbotResponse {
  response: string;                 // AI-generated response (used by the UI)
  suggestions?: string[];           // Suggested follow-up questions (used by the UI)
  confidence?: number;              // Confidence score (0-1)
  sources?: string[];               // Medical sources/references
  relatedTopics?: string[];         // Related medical topics
  urgency?: 'low' | 'medium' | 'high'; // Urgency level
  requiresDoctor?: boolean;         // Whether doctor consultation is recommended
}
```

In the Angular frontend (`ChatbotResponse` in `src/app/services/patient.service.ts`), only the `response` and `suggestions` fields are currently used. The additional fields above are safe to include in backend responses and can be wired into the UI later without breaking existing behaviour.

### OCRResult
```typescript
interface OCRResult {
  text: string;                     // Extracted text
  confidence: number;               // OCR confidence (0-1)
  medications?: Medication[];      // Extracted medications
  doctorName?: string;              // Extracted doctor name
  date?: string;                    // Extracted date
  structuredData?: {
    medications: Medication[];
    dosage: string;
    frequency: string;
    duration: string;
  };
}
```

### Medication (from OCR)
```typescript
interface Medication {
  name: string;                     // Medication name
  dosage: string;                   // Dosage (e.g., "500mg")
  frequency: string;                // Frequency (e.g., "3 times daily")
  duration: string;                 // Duration (e.g., "7 days")
  confidence?: number;              // Extraction confidence
}
```

### XRayAnalysis
```typescript
interface XRayAnalysis {
  findings: string;                  // AI-detected findings
  recommendations: string;          // AI recommendations
  confidence: number;               // Analysis confidence (0-1)
  abnormalities: {
    detected: boolean;
    type?: string;                  // Type of abnormality
    location?: string;              // Location in image
    severity?: 'mild' | 'moderate' | 'severe';
  };
  normalStructures: string[];       // Normal structures identified
  measurements?: {
    heartSize?: string;
    lungVolume?: string;
    other?: any;
  };
  aiAnalysis: string;                // Full AI analysis text
}
```

### TestReportAnalysis
```typescript
interface TestReportAnalysis {
  analysis: string;                  // AI analysis of test report
  keyFindings: string[];            // Key findings extracted
  normalValues: boolean;             // Whether values are normal
  abnormalities: {
    detected: boolean;
    parameters: string[];            // Abnormal parameters
    severity?: 'mild' | 'moderate' | 'severe';
  };
  recommendations: string[];        // AI recommendations
  confidence: number;                // Analysis confidence (0-1)
}
```

---

## Chatbot Implementation

### Requirements

1. **Medical Knowledge Base**
   - Should have access to medical information database
   - Should provide accurate, evidence-based responses
   - Should cite medical sources when appropriate

2. **Context Awareness**
   - Should consider patient's medical history if available
   - Should consider recent health metrics
   - Should personalize responses based on patient data

3. **Safety Features**
   - Should NOT provide diagnoses
   - Should recommend doctor consultation for serious symptoms
   - Should include disclaimers about medical advice
   - Should escalate to human doctor when appropriate

4. **Response Quality**
   - Responses should be clear and easy to understand
   - Should avoid medical jargon when possible
   - Should provide actionable advice
   - Should suggest follow-up questions

### Suggested Follow-up Questions

The chatbot should provide contextual follow-up suggestions based on the query. Examples:

- For symptoms: "What should I do for a fever?", "How can I manage my diabetes?"
- For conditions: "What are the treatment options?", "What are the risk factors?"
- For medications: "What are the side effects?", "Can I take this with other medications?"

### Urgency Detection

The AI should assess query urgency:
- **Low**: General health information, preventive care
- **Medium**: Symptoms that may need attention
- **High**: Emergency symptoms, severe pain, difficulty breathing

### Example Chatbot Flow

```
User: "I have a headache"
AI: "Headaches can have various causes. How long have you been experiencing this headache? Is it severe?"

User: "It's been 2 days and it's moderate"
AI: "A headache lasting 2 days with moderate severity could be due to various factors like tension, dehydration, or other causes. I recommend:
1. Ensure you're well-hydrated
2. Get adequate rest
3. Consider over-the-counter pain relief if appropriate
4. If the headache persists or worsens, consult with a healthcare provider.

Would you like to know more about headache management or schedule an appointment?"
```

---

## OCR Implementation

### Purpose
Extract text and structured data from prescription images.

### Endpoint Integration
OCR is integrated into:
- `POST /api/doctor/patients/{patientId}/records` (when prescription image/PDF is uploaded)
- Prescription upload process

### Input
- Image file (JPG, PNG, PDF)
- Prescription image containing medication information

### Output
```json
{
  "ocrText": "Full extracted text from prescription",
  "medications": [
    {
      "name": "Paracetamol",
      "dosage": "500mg",
      "frequency": "3 times daily",
      "duration": "7 days",
      "confidence": 0.92
    }
  ],
  "doctorName": "Dr. Ahmed Khan",
  "date": "2024-01-15",
  "structuredData": {
    "medications": [...],
    "instructions": "Take with food",
    "refill": "No"
  }
}
```

### OCR Requirements

1. **Accuracy**
   - Minimum 85% accuracy for medication names
   - Minimum 90% accuracy for dosage information
   - Should handle handwritten and printed prescriptions

2. **Medication Extraction**
   - Extract medication name
   - Extract dosage (mg, ml, units)
   - Extract frequency (times per day)
   - Extract duration (days, weeks)

3. **Additional Data**
   - Doctor name
   - Date
   - Patient name (if visible)
   - Special instructions

4. **Error Handling**
   - Should return confidence scores
   - Should flag low-confidence extractions
   - Should allow manual correction

### AI Analysis After OCR

After OCR extraction, AI should:
- Validate medication names against drug database
- Check for potential drug interactions
- Suggest standard dosages if unclear
- Flag any unusual or potentially incorrect information

---

## X-Ray Analysis

### Purpose
Analyze X-ray images to detect abnormalities and provide findings.

### Endpoint Integration
X-Ray analysis is integrated into:
- `POST /api/doctor/patients/{patientId}/records` (when X-ray image is uploaded)

### Input
- X-ray image file (DICOM, JPG, PNG)
- Patient ID
- Optional: Previous X-rays for comparison

### Output
```json
{
  "aiAnalysis": "No acute abnormalities detected. Lungs appear clear. Heart size is within normal limits. No evidence of pneumonia or pleural effusion.",
  "findings": "Normal chest X-ray. No significant findings.",
  "recommendations": "Continue routine follow-up. No immediate intervention required.",
  "confidence": 0.88,
  "abnormalities": {
    "detected": false,
    "type": null,
    "location": null,
    "severity": null
  },
  "normalStructures": [
    "Lungs",
    "Heart",
    "Ribs",
    "Diaphragm"
  ],
  "measurements": {
    "heartSize": "Within normal limits",
    "lungVolume": "Normal"
  }
}
```

### X-Ray Analysis Requirements

1. **Detection Capabilities**
   - Detect common abnormalities (pneumonia, fractures, etc.)
   - Identify normal anatomical structures
   - Measure key anatomical features
   - Compare with previous X-rays if available

2. **Output Format**
   - Clear findings in plain language
   - Medical terminology when appropriate
   - Recommendations for follow-up
   - Confidence scores

3. **Safety**
   - Should NOT replace radiologist review
   - Should flag uncertain findings
   - Should recommend specialist review for complex cases
   - Should include disclaimers

4. **Supported X-Ray Types**
   - Chest X-rays (priority)
   - Bone X-rays
   - Other types (future expansion)

### Example X-Ray Analysis Output

**Normal X-Ray:**
```
AI Analysis: No acute abnormalities detected. Lungs appear clear. Heart size is within normal limits. No evidence of pneumonia or pleural effusion.
```

**Abnormal X-Ray:**
```
AI Analysis: Detected opacity in the right lower lobe consistent with possible pneumonia. Heart size is within normal limits. Recommend clinical correlation and follow-up imaging if symptoms persist.
```

---

## Test Report Analysis

### Purpose
Analyze lab test reports and extract key findings.

### Endpoint Integration
Test report analysis is integrated into:
- `POST /api/patient/upload-document` (when test report is uploaded)

### Input
- Test report file (PDF, JPG, PNG)
- Patient ID
- Optional: Previous test results for comparison

### Output
```json
{
  "analysis": "Blood test results show normal ranges for most parameters. Slight elevation in cholesterol levels. Recommend lifestyle modifications.",
  "keyFindings": [
    "Cholesterol: 220 mg/dL (slightly elevated)",
    "Blood Sugar: 95 mg/dL (normal)",
    "Hemoglobin: 14.2 g/dL (normal)"
  ],
  "normalValues": false,
  "abnormalities": {
    "detected": true,
    "parameters": ["Cholesterol"],
    "severity": "mild"
  },
  "recommendations": [
    "Maintain healthy diet",
    "Regular exercise",
    "Follow-up test in 3 months"
  ],
  "confidence": 0.91
}
```

### Test Report Analysis Requirements

1. **Data Extraction**
   - Extract test parameters and values
   - Identify normal/abnormal ranges
   - Extract reference ranges
   - Extract test date and lab information

2. **Analysis**
   - Compare values against normal ranges
   - Identify abnormalities
   - Assess severity (mild, moderate, severe)
   - Compare with previous results if available

3. **Recommendations**
   - Provide actionable recommendations
   - Suggest follow-up tests if needed
   - Recommend lifestyle changes when appropriate
   - Flag urgent findings

4. **Supported Test Types**
   - Blood tests (CBC, lipid panel, etc.)
   - Urine tests
   - Other lab reports (future expansion)

---

## AI Integration Requirements

### API Integration

1. **Request Format**
   - All AI endpoints should accept JSON
   - File uploads should use FormData
   - Include patient context when available

2. **Response Format**
   - Consistent JSON structure
   - Include confidence scores
   - Include error handling

3. **Performance**
   - Chatbot responses: < 3 seconds
   - OCR processing: < 5 seconds
   - X-Ray analysis: < 10 seconds
   - Test report analysis: < 8 seconds

4. **Error Handling**
   - Graceful degradation
   - Clear error messages
   - Fallback to manual processing if AI fails

### Security & Privacy

1. **Data Protection**
   - All medical data must be encrypted
   - Patient data should not be stored longer than necessary
   - Comply with HIPAA regulations

2. **Access Control**
   - Only authorized users can access AI features
   - Patient data should be anonymized when possible
   - Audit logs for all AI operations

3. **Model Security**
   - Secure model endpoints
   - Rate limiting
   - Input validation
   - Output sanitization

### Model Requirements

1. **Chatbot Model**
   - Medical knowledge base
   - Natural language understanding
   - Context awareness
   - Safety filters

2. **OCR Model**
   - Handwritten text recognition
   - Printed text recognition
   - Medical terminology understanding
   - Structured data extraction

3. **X-Ray Analysis Model**
   - Medical image analysis
   - Abnormality detection
   - Anatomical structure identification
   - Measurement capabilities

4. **Test Report Analysis Model**
   - Document parsing
   - Data extraction
   - Value interpretation
   - Trend analysis

---

## Response Formats

### Standard AI Response (Recommended)
```json
{
  "success": true,
  "data": {
    // AI-specific data
  },
  "confidence": 0.95,
  "processingTime": 2.3,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response (Recommended)
```json
{
  "success": false,
  "error": {
    "code": "AI_PROCESSING_ERROR",
    "message": "Unable to process request",
    "details": "Model timeout"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Error Handling

### Common Error Codes

- `AI_TIMEOUT`: AI processing timeout
- `AI_MODEL_ERROR`: Model processing error
- `AI_INVALID_INPUT`: Invalid input data
- `AI_LOW_CONFIDENCE`: Low confidence in results
- `AI_UNAVAILABLE`: AI service unavailable

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "AI_ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Technical details (optional)"
  },
  "fallback": {
    "available": true,
    "message": "Manual processing recommended"
  }
}
```

---

## Testing & Validation

### Test Cases

1. **Chatbot**
   - General health questions
   - Symptom queries
   - Medication questions
   - Emergency scenarios (should escalate)

2. **OCR**
   - Printed prescriptions
   - Handwritten prescriptions
   - Various image qualities
   - Multiple languages (if supported)

3. **X-Ray Analysis**
   - Normal X-rays
   - Abnormal X-rays
   - Various image qualities
   - Different X-ray types

4. **Test Report Analysis**
   - Various report formats
   - Normal results
   - Abnormal results
   - Multiple test types

### Validation Metrics

- **Accuracy**: Minimum 85% for all AI features
- **Confidence**: Should provide confidence scores
- **Response Time**: Within specified limits
- **Error Rate**: < 5% for production

---

**Last Updated:** 2026-03-23
**Version:** 1.2

