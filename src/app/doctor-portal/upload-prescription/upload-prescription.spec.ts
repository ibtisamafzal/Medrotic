import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadPrescription } from './upload-prescription';

describe('UploadPrescription', () => {
  let component: UploadPrescription;
  let fixture: ComponentFixture<UploadPrescription>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadPrescription]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadPrescription);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
