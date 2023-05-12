import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyNumberComponent } from './buy-number.component';

describe('BuyNumberComponent', () => {
  let component: BuyNumberComponent;
  let fixture: ComponentFixture<BuyNumberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BuyNumberComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
