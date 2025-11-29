import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentStorage } from './document-storage';

describe('DocumentStorage', () => {
  let component: DocumentStorage;
  let fixture: ComponentFixture<DocumentStorage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentStorage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentStorage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
