import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecureCommunication } from './secure-communication';

describe('SecureCommunication', () => {
  let component: SecureCommunication;
  let fixture: ComponentFixture<SecureCommunication>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecureCommunication]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecureCommunication);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
