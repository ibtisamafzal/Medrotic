import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageDoctors } from './manage-doctors';

describe('ManageDoctors', () => {
  let component: ManageDoctors;
  let fixture: ComponentFixture<ManageDoctors>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageDoctors]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageDoctors);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
