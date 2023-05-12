import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CdrsComponent } from './cdrs.component';

describe('CdrsComponent', () => {
  let component: CdrsComponent;
  let fixture: ComponentFixture<CdrsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CdrsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CdrsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
