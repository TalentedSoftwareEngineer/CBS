import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CallCountRangeComponent } from './call-count-range.component';

describe('CallCountRangeComponent', () => {
  let component: CallCountRangeComponent;
  let fixture: ComponentFixture<CallCountRangeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CallCountRangeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CallCountRangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
