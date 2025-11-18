import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewPrescriptions } from './view-prescriptions';

describe('ViewPrescriptions', () => {
  let component: ViewPrescriptions;
  let fixture: ComponentFixture<ViewPrescriptions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewPrescriptions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewPrescriptions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
