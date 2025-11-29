import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageRepository } from './manage-repository';

describe('ManageRepository', () => {
  let component: ManageRepository;
  let fixture: ComponentFixture<ManageRepository>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageRepository]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageRepository);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
