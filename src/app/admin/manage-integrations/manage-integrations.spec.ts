import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageIntegrations } from './manage-integrations';

describe('ManageIntegrations', () => {
  let component: ManageIntegrations;
  let fixture: ComponentFixture<ManageIntegrations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageIntegrations]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageIntegrations);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
