import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PatientPortalLayout } from './patient-portal-layout/patient-portal-layout';
import { Dashboard } from './dashboard/dashboard';
import { ProfileSettings } from './profile-settings/profile-settings';
import { ViewMedicalHistory } from './view-medical-history/view-medical-history';
import { AddMetrics } from './add-metrics/add-metrics';
import { AiChatbot } from './ai-chatbot/ai-chatbot';
import { DoctorSearch } from './doctor-search/doctor-search';
import { TestReportAnalysis } from './test-report-analysis/test-report-analysis';
import { UploadDocuments } from './upload-documents/upload-documents';
import { ViewPrescriptions } from './view-prescriptions/view-prescriptions';
import { ViewXrays } from './view-xrays/view-xrays';
import { Notifications } from './notifications/notifications';
import { AccessRecords } from './access-records/access-records';

const routes: Routes = [
  {
    path: '',
    component: PatientPortalLayout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'profile-settings', component: ProfileSettings },
      { path: 'view-medical-history', component: ViewMedicalHistory },
      { path: 'add-metrics', component: AddMetrics },
      { path: 'ai-chatbot', component: AiChatbot },
      { path: 'doctor-search', component: DoctorSearch },
      { path: 'test-report-analysis', component: TestReportAnalysis },
      { path: 'upload-documents', component: UploadDocuments },
      { path: 'view-prescriptions', component: ViewPrescriptions },
      { path: 'view-xrays', component: ViewXrays },
      { path: 'notifications', component: Notifications },
      { path: 'access-records', component: AccessRecords }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PatientPortalRoutingModule { }