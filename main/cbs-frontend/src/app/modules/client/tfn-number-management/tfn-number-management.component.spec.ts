import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TfnNumberManagementComponent } from './tfn-number-management.component';

describe('TfnNumberManagementComponent', () => {
  let component: TfnNumberManagementComponent;
  let fixture: ComponentFixture<TfnNumberManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TfnNumberManagementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TfnNumberManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
