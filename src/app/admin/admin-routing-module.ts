import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { ManageDoctors } from './manage-doctors/manage-doctors';
import { ManagePatients } from './manage-patients/manage-patients';
import { UserVerification } from './user-verification/user-verification';
import { SystemHealth } from './system-health/system-health';
import { ManageIntegrations } from './manage-integrations/manage-integrations';
import { ManageRepository } from './manage-repository/manage-repository';
import { Analytics } from './analytics/analytics';
import { Notifications } from './notifications/notifications';
import { ProfileSettings } from './profile-settings/profile-settings';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'manage-doctors', component: ManageDoctors },
  { path: 'manage-patients', component: ManagePatients },
  { path: 'user-verification', component: UserVerification },
  { path: 'system-health', component: SystemHealth },
  { path: 'manage-integrations', component: ManageIntegrations },
  { path: 'manage-repository', component: ManageRepository },
  { path: 'analytics', component: Analytics },
  { path: 'notifications', component: Notifications },
  { path: 'profile-settings', component: ProfileSettings }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }