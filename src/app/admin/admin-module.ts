import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing-module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    AdminRoutingModule
    // All components are standalone and imported via routing
  ]
})
export class AdminModule { }
