import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagePatients } from './manage-patients';

describe('ManagePatients', () => {
  let component: ManagePatients;
  let fixture: ComponentFixture<ManagePatients>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagePatients]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagePatients);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
