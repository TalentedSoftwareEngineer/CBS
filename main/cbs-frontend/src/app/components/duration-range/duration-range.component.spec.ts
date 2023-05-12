import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DurationRangeComponent } from './duration-range.component';

describe('DurationRangeComponent', () => {
  let component: DurationRangeComponent;
  let fixture: ComponentFixture<DurationRangeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DurationRangeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DurationRangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
