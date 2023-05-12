import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorRateComparisonComponent } from './vendor-rate-comparison.component';

describe('VendorRateComparisonComponent', () => {
  let component: VendorRateComparisonComponent;
  let fixture: ComponentFixture<VendorRateComparisonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VendorRateComparisonComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorRateComparisonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
