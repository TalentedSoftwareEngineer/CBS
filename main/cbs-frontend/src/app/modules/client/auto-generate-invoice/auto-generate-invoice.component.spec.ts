import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoGenerateInvoiceComponent } from './auto-generate-invoice.component';

describe('AutoGenerateInvoiceComponent', () => {
  let component: AutoGenerateInvoiceComponent;
  let fixture: ComponentFixture<AutoGenerateInvoiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AutoGenerateInvoiceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoGenerateInvoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
