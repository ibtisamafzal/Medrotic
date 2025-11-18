import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserVerification } from './user-verification';

describe('UserVerification', () => {
  let component: UserVerification;
  let fixture: ComponentFixture<UserVerification>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserVerification]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserVerification);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
