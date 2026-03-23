import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
  private adminBaseUrl = '/api/admin/analytics';
  private doctorBaseUrl = '/api/doctor/analytics';
  private patientBaseUrl = '/api/patient/analytics';

  constructor(private http: HttpClient) {}

  // Dashboard analytics from admin analytics endpoint.
  getDashboardAnalytics(): Observable<AnalyticsData> {
    return this.http.get<{ message?: string; data: AnalyticsData }>(this.adminBaseUrl).pipe(
      map((response) => response?.data || {})
    );
  }

  // Current backend patient analytics endpoint returns current patient analytics.
  getPatientAnalytics(patientId: string): Observable<any> {
    return this.http.get<any>(this.patientBaseUrl).pipe(
      map((response) => response?.data || response)
    );
  }

  // Use admin analytics as system-level metrics source.
  getSystemHealth(): Observable<any> {
    return this.http.get<any>(this.adminBaseUrl);
  }

  // Use doctor analytics for usage trend proxy.
  getUsageStatistics(startDate?: string, endDate?: string): Observable<any> {
    return this.http.get<any>(this.doctorBaseUrl);
  }
}

