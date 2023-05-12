import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LrnComponent } from './lrn.component';

describe('LrnComponent', () => {
  let component: LrnComponent;
  let fixture: ComponentFixture<LrnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LrnComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LrnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
