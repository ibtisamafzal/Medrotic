export const environment = {
  production: false,
  apiUrl: 'https://localhost:7124',
  /** Empty = same origin; dev server proxies /ocr → OCR service (see proxy.conf.json). */
  ocrApiBaseUrl: '',
  /** Must match FastAPI `X-API-Key` (e.g. Medrotic.Api appsettings AIService:ApiKey). */
  ocrApiKey: 'change-me-in-production'
};