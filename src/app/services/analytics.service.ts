import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AnalyticsData {
  totalPatients?: number;
  totalDoctors?: number;
  totalPrescriptions?: number;
  totalDocuments?: number;
  recentActivity?: any[];
  dateRange?: {
    start: string;
    end: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  constructor(private http: HttpClient) {}

  // Get dashboard analytics
  getDashboardAnalytics(): Observable<AnalyticsData> {
    return this.http.get<AnalyticsData>('/api/analytics/dashboard');
  }

  // Get patient analytics
  getPatientAnalytics(patientId: string): Observable<any> {
    return this.http.get<any>(`/api/analytics/patient/${patientId}`);
  }

  // Get system health metrics
  getSystemHealth(): Observable<any> {
    return this.http.get<any>('/api/analytics/system-health');
  }

  // Get usage statistics
  getUsageStatistics(startDate?: string, endDate?: string): Observable<any> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return this.http.get<any>('/api/analytics/usage', { params });
  }
}

