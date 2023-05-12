import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerNumberComponent } from './customer-number.component';

describe('CustomerNumberComponent', () => {
  let component: CustomerNumberComponent;
  let fixture: ComponentFixture<CustomerNumberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomerNumberComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomerNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
