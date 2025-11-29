import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewXrays } from './view-xrays';

describe('ViewXrays', () => {
  let component: ViewXrays;
  let fixture: ComponentFixture<ViewXrays>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewXrays]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewXrays);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
