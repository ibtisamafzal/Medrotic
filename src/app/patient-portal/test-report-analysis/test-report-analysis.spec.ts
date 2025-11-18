import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestReportAnalysis } from './test-report-analysis';

describe('TestReportAnalysis', () => {
  let component: TestReportAnalysis;
  let fixture: ComponentFixture<TestReportAnalysis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestReportAnalysis]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestReportAnalysis);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
