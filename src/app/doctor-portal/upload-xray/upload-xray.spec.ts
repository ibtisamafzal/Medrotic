import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadXray } from './upload-xray';

describe('UploadXray', () => {
  let component: UploadXray;
  let fixture: ComponentFixture<UploadXray>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadXray]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadXray);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
