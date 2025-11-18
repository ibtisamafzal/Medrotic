import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMetrics } from './add-metrics';

describe('AddMetrics', () => {
  let component: AddMetrics;
  let fixture: ComponentFixture<AddMetrics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddMetrics]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddMetrics);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
