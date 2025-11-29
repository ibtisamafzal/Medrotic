import { NgModule } from '@angular/core';
import { CommonModule as NgCommonModule } from '@angular/common';
import { CommonRoutingModule } from './common-routing.module';
// ... import all components

@NgModule({
  declarations: [
    // ... all components
  ],
  imports: [
    NgCommonModule,
    CommonRoutingModule
  ]
})
export class CommonModule { }