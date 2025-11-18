import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewMedicalHistory } from './view-medical-history';

describe('ViewMedicalHistory', () => {
  let component: ViewMedicalHistory;
  let fixture: ComponentFixture<ViewMedicalHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewMedicalHistory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewMedicalHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
