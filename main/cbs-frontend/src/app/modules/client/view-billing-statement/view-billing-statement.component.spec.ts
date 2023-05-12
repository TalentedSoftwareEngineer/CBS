import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewBillingStatementComponent } from './view-billing-statement.component';

describe('ViewBillingStatementComponent', () => {
  let component: ViewBillingStatementComponent;
  let fixture: ComponentFixture<ViewBillingStatementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewBillingStatementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewBillingStatementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
