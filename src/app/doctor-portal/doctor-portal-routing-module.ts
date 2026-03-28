import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DoctorPortalLayout } from './doctor-portal-layout/doctor-portal-layout';
import { Dashboard } from './dashboard/dashboard';
import { ProfileSettings } from './profile-settings/profile-settings';
import { PatientManagement } from './patient-management/patient-management';
import { RegisterPatient } from './register-patient/register-patient';
import { PatientDetails } from './patient-details/patient-details';
import { UploadPrescription } from './upload-prescription/upload-prescription';
import { UploadXray } from './upload-xray/upload-xray';
import { SecureCommunication } from './secure-communication/secure-communication';
import { PatientAnalytics } from './patient-analytics/patient-analytics';
import { Notifications } from './notifications/notifications';
import { DocumentStorage } from './document-storage/document-storage';

const routes: Routes = [
  {
    path: '',
    component: DoctorPortalLayout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'profile-settings', component: ProfileSettings },
      { path: 'patient-management', component: PatientManagement },
      { path: 'register-patient', component: RegisterPatient },
      { path: 'patient-details/:id', component: PatientDetails },
      { path: 'upload-prescription', component: UploadPrescription },
      { path: 'upload-xray', component: UploadXray },
      { path: 'secure-communication', component: SecureCommunication },
      { path: 'patient-analytics', component: PatientAnalytics },
      { path: 'patient-analytics/:id', component: PatientAnalytics },
      { path: 'notifications', component: Notifications },
      { path: 'document-storage', component: DocumentStorage }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DoctorPortalRoutingModule { }