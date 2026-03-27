import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { PatientDetails } from './patient-details';

describe('PatientDetails', () => {
  let component: PatientDetails;
  let fixture: ComponentFixture<PatientDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientDetails, RouterTestingModule, HttpClientTestingModule],
      providers: [{ provide: ActivatedRoute, useValue: { params: of({ id: 'test-patient-id' }) } }]
    }).compileComponents();

    fixture = TestBed.createComponent(PatientDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
