import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccessRecords } from './access-records';

describe('AccessRecords', () => {
  let component: AccessRecords;
  let fixture: ComponentFixture<AccessRecords>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccessRecords]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccessRecords);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
