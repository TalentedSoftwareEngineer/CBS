import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DidNumberManagementComponent } from './did-number-management.component';

describe('DidNumberManagementComponent', () => {
  let component: DidNumberManagementComponent;
  let fixture: ComponentFixture<DidNumberManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DidNumberManagementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DidNumberManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
