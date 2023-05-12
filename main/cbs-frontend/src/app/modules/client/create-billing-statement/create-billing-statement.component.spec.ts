import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateBillingStatementComponent } from './create-billing-statement.component';

describe('CreateBillingStatementComponent', () => {
  let component: CreateBillingStatementComponent;
  let fixture: ComponentFixture<CreateBillingStatementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateBillingStatementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateBillingStatementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
