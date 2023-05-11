import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RerateCallsComponent } from './rerate-calls.component';

describe('RerateCallsComponent', () => {
  let component: RerateCallsComponent;
  let fixture: ComponentFixture<RerateCallsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RerateCallsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RerateCallsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
