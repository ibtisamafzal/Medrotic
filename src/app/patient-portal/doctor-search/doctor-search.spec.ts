import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorSearch } from './doctor-search';

describe('DoctorSearch', () => {
  let component: DoctorSearch;
  let fixture: ComponentFixture<DoctorSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorSearch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctorSearch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
